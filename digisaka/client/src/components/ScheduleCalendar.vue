<script setup>
import { computed } from 'vue';
import { scheduleEvents, monthGrids } from '../helpers/schedule.js';
import { todayIso } from '../helpers/today.js';

const props = defineProps({ days: { type: Array, default: () => [] }, applications: { type: Array, default: () => [] } });
const months = computed(() => monthGrids(scheduleEvents(props.days, props.applications)));
const short = (iso) => `${iso.slice(8)}/${iso.slice(5, 7)}`;
const range = (e) => (e.kind === 'application' ? `${short(e.start)} – ${short(e.end)}` : short(e.date));
const KIND = { application: { icon: '💊', cls: 'gold' }, monitoring: { icon: '🔍', cls: 'plum' } };
const todayDay = (m) => (todayIso().startsWith(m.key) ? Number(todayIso().slice(8)) : null);
</script>

<template>
  <p v-if="!months.length" class="empty">No application or assessment days are scheduled.</p>
  <template v-for="m in months" :key="m.key">
    <section class="prop-card cal">
      <h3>{{ m.month }} {{ m.year }}</h3>
      <div class="grid">
        <span v-for="w in ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']" :key="w" class="wd">{{ w }}</span>
        <template v-for="(c, i) in m.cells" :key="i">
          <span v-if="!c" />
          <span v-else-if="m.onDay[c]" class="cell ev" :class="[KIND[m.onDay[c][0].kind].cls, { today: c === todayDay(m), done: m.onDay[c].some((e) => e.done) }]">
            <b>{{ c }}</b><i>{{ m.onDay[c].some((e) => e.done) ? '✓' : m.onDay[c].map((e) => KIND[e.kind].icon).join('') }}</i>
          </span>
          <span v-else class="cell" :class="{ today: c === todayDay(m) }">{{ c }}</span>
        </template>
      </div>
    </section>
    <section class="prop-card tl">
      <header><h3>{{ m.month }} {{ m.year }} — Timeline</h3><span class="count">{{ m.done }} / {{ m.events.filter((e) => e.kind === 'application').length }} applied</span></header>
      <ol>
        <li v-for="e in m.events" :key="e.date + e.kind + e.label" :class="[KIND[e.kind].cls, { done: e.done }]">
          <span class="node">{{ e.done ? '✓' : '' }}</span>
          <div class="date">{{ range(e) }}</div>
          <div class="card">
            <h5>{{ e.label }}<small v-if="e.moa"> · {{ e.moa }}</small></h5>
            <p v-if="e.kind === 'application'">Apply between {{ e.start }} and {{ e.end }}.<template v-if="e.done"> Applied.</template></p>
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
.grid { display: grid; grid-template-columns: repeat(7, 1fr); gap: 6px; }
.wd { text-align: center; font: 700 12px var(--font-body); color: var(--ink-soft); }
.cell { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 46px; border-radius: 10px; font-size: 13px; color: var(--ink-soft); }
.cell.ev { font-weight: 800; color: var(--ink); } .cell.ev i { font-style: normal; font-size: 14px; }
.cell.gold { background: #FCE7C8; } .cell.plum { background: #EADCF0; } .cell.done { background: #D5E9DB; }
.cell.today { outline: 2px solid var(--forest); }
.tl header { display: flex; justify-content: space-between; align-items: center; } .count { font-size: 13px; color: var(--ink-soft); }
.tl ol { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 10px; }
.tl li { display: grid; grid-template-columns: 22px 92px 1fr; gap: 10px; align-items: start; }
.node { display: grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; border: 2px solid #D98A00; font-size: 12px; color: #fff; }
.plum .node { border-color: #8A4FA0; } .done .node { background: var(--forest); border-color: var(--forest); }
.date { font: 800 14px var(--font-display); color: var(--forest); }
.card h5 { font: 800 15px var(--font-display); } .card small { color: var(--ink-soft); font-weight: 600; }
.card p { margin-top: 2px; font-size: 13.5px; color: var(--ink-soft); }
</style>
