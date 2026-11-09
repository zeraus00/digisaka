<script setup>
import { computed, ref, watch } from 'vue';
import '../styles/journey.css';
import { scheduleEvents, monthGrids, STEP_KIND, STATUS_LABEL, STATUS_TONE, MIXTURE_NOTE } from '../helpers/schedule.js';
import { todayIso } from '../helpers/today.js';

const props = defineProps({ days: { type: Array, default: () => [] }, applications: { type: Array, default: () => [] }, nameOf: { type: Function, default: (id) => id }, assessedWeeks: { type: Array, default: () => [] } });
const events = computed(() => scheduleEvents(props.days, props.applications, props.nameOf, props.assessedWeeks));
const months = computed(() => monthGrids(events.value));
// The month shown opens on today's month when the schedule has it, else the first.
const at = ref(0);
watch(months, (ms) => { const i = ms.findIndex((m) => todayIso().startsWith(m.key)); at.value = Math.max(i, 0); }, { immediate: true });
const m = computed(() => months.value[at.value]);
const short = (iso) => `${iso.slice(8)}/${iso.slice(5, 7)}`;
const range = (e) => (e.kind === 'application' && e.start ? `${short(e.start)} – ${short(e.end)}` : short(e.date));
// Suggested steps are outlined; recorded applications are filled.
const KIND = { application: { icon: '💊', cls: 'sug' }, monitoring: { icon: '🔍', cls: 'plum' }, applied: { icon: '✓', cls: 'rec' }, skipped: { icon: '⏭', cls: 'skip' } };
const cellClass = (day) => (day.some((e) => e.kind === 'applied') ? 'rec' : KIND[day[0].kind].cls);
const todayDay = computed(() => (m.value && todayIso().startsWith(m.value.key) ? Number(todayIso().slice(8)) : null));
const count = computed(() => `${events.value.filter((e) => e.kind === 'applied').length} recorded · ${events.value.filter((e) => e.kind === 'application').length} suggested`);
</script>

<template>
  <p v-if="!m" class="empty">No application or assessment days are scheduled.</p>
  <template v-else>
    <section class="prop-card cal">
      <header>
        <button type="button" :disabled="at === 0" aria-label="Previous month" @click="at--">‹</button>
        <h3>{{ m.month }} {{ m.year }}</h3>
        <button type="button" :disabled="at === months.length - 1" aria-label="Next month" @click="at++">›</button>
      </header>
      <ul class="legend" aria-label="Legend">
        <li><span class="swatch sug" aria-hidden="true"></span>Suggested step</li>
        <li><span class="swatch rec" aria-hidden="true"></span>Recorded application</li>
        <li><span class="swatch plum" aria-hidden="true"></span>Scan day</li>
      </ul>
      <div class="grid">
        <span v-for="w in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="w" class="wd">{{ w }}</span>
        <template v-for="(c, i) in m.cells" :key="i">
          <span v-if="!c" />
          <span v-else-if="m.onDay[c]" class="cell ev" :class="[cellClass(m.onDay[c]), { today: c === todayDay }]">
            <b>{{ c }}</b><i>{{ m.onDay[c].map((e) => KIND[e.kind].icon).join('') }}</i>
          </span>
          <span v-else class="cell" :class="{ today: c === todayDay }">{{ c }}</span>
        </template>
      </div>
    </section>
    <section class="prop-card tl">
      <header><h3>Timeline</h3><span class="count">{{ count }}</span></header>
      <ol>
        <li v-for="e in events" :key="e.date + e.kind + e.label" :class="[KIND[e.kind].cls, { done: e.done }]">
          <span class="node">{{ e.done ? '✓' : '' }}</span>
          <div class="date">{{ range(e) }}<small>{{ e.date.slice(0, 4) }}</small></div>
          <div class="card">
            <h5>{{ e.label }}<small v-if="e.moa"> · FRAC {{ e.moa }}</small> <span v-if="STEP_KIND[e.step]" class="jr-pill" :class="e.step === 'multisite' ? 'warn' : 'ok'">{{ STEP_KIND[e.step] }}</span>
              <span v-if="e.status" class="jr-pill" :class="STATUS_TONE[e.status]">{{ STATUS_LABEL[e.status] }}</span><span v-if="e.offPlan" class="jr-pill">Off-plan</span></h5>
            <template v-if="e.status && e.kind !== 'application'">
              <p v-if="e.kind === 'skipped'">Skipped on {{ e.skip?.on ?? e.date }}.<template v-if="e.skip?.reason"> Reason: {{ e.skip.reason.replace('_', ' ') }}.</template></p>
              <p v-else>Applied on {{ e.date }}.</p>
              <p v-if="e.why" class="why">{{ e.why }}</p>
              <p v-if="e.note" class="why">{{ e.note }}</p>
            </template>
            <p v-else-if="e.kind === 'applied'">Applied on {{ e.date }}.</p>
            <template v-else-if="e.kind === 'application'">
              <p>Apply between {{ e.start }} and {{ e.end }}.<template v-if="e.done"> Applied.</template></p>
              <p v-if="e.why" class="why">{{ e.why }}</p>
              <p v-if="e.note" class="why">{{ e.note }}</p>
              <p v-if="e.partner" class="why">{{ MIXTURE_NOTE }}</p>
            </template>
            <p v-else>Scan this line again on {{ e.date }}.<template v-if="e.after"> Follows {{ e.after }}.</template></p>
          </div>
        </li>
      </ol>
    </section>
  </template>
</template>

<style scoped>
.empty { padding: 30px; text-align: center; color: var(--ink-soft); border: 1.5px dashed var(--line); border-radius: var(--radius-md); background: var(--card); }
.prop-card { padding: 18px; margin-bottom: 18px; border-radius: 20px; background: var(--card); box-shadow: var(--shadow); }
.prop-card h3 { font: 800 20px var(--font-display); color: var(--forest); margin-bottom: 8px; }
.cal header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; } .cal header h3 { margin: 0; }
.cal header button { width: 36px; height: 36px; border: 1px solid var(--line); border-radius: 10px; background: none; font-size: 18px; color: var(--forest); } .cal header button:disabled { opacity: .35; }
.grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.wd { text-align: center; font: 700 12px var(--font-body); color: var(--ink-soft); }
.cell { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 46px; border-radius: 10px; font-size: 13px; color: var(--ink-soft); }
.cell.ev { font-weight: 800; color: var(--ink); } .cell.ev i { font-style: normal; font-size: 14px; }
.cell.skip { background: #ECECEC; } .cell.sug { background: none; border: 2px solid #D98A00; } .cell.plum { background: #EADCF0; } .cell.rec { background: var(--forest); color: #fff; }
.cell.rec b { color: #fff; }
.legend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 0 0 10px; padding: 0; list-style: none; font-size: 13px; color: var(--ink-soft); }
.legend li { display: flex; align-items: center; gap: 6px; }
.swatch { width: 14px; height: 14px; border-radius: 4px; }
.swatch.sug { border: 2px solid #D98A00; } .swatch.rec { background: var(--forest); } .swatch.plum { background: #EADCF0; }
.cell.today { outline: 2px solid var(--forest); }
.tl header { display: flex; justify-content: space-between; align-items: center; } .count { font-size: 13px; color: var(--ink-soft); }
.tl ol { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 10px; }
.tl li.sug .node { border-color: #D98A00; }
.tl li.rec .node { background: var(--forest); border-color: var(--forest); }
.tl li { display: grid; grid-template-columns: 22px 92px 1fr; gap: 10px; align-items: start; }
.node { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #D98A00; font-size: 12px; color: #fff; }
.tl li.skip .node { border-color: #7a7a7a; } .tl li.skip { opacity: .75; }
.plum .node { border-color: #8A4FA0; } .done .node { background: var(--forest); border-color: var(--forest); }
.date { font: 800 14px var(--font-display); color: var(--forest); } .date small { display: block; font-weight: 600; color: var(--ink-soft); }
.card h5 { font: 800 15px var(--font-display); } .card small { color: var(--ink-soft); font-weight: 600; }
.card p { margin-top: 2px; font-size: 13.5px; color: var(--ink-soft); } .card .why { font-style: italic; }
</style>
