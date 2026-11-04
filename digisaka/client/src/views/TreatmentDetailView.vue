<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import EvidenceCharts from '../components/EvidenceCharts.vue';
import ProductCard from '../components/ProductCard.vue';
import ScheduleCalendar from '../components/ScheduleCalendar.vue';
import { useSuggestionStore } from '../stores/suggestion.js';
import { outcomeReasonText } from '../helpers/messages.js';
import { orderAlerts, LEVEL_ICON } from '../helpers/alerts.js';
import { todayIso, keepIfEdited } from '../helpers/today.js';

const route = useRoute(), store = useSuggestionStore();
const lineId = computed(() => String(route.params.lineId));
const week = computed(() => String(route.params.week));

const sug = computed(() => store.suggestion);
const BASIS = {
  stage_confirmed: 'Based on the stage you confirmed from this line\'s scans',
  all_healthy_images: 'Based on healthy images only: no stage is confirmed',
  no_confirmed_stage: 'No stage is confirmed for this line yet',
};
const OUTCOME = { human_review_required: 'Human Review Required', continue_monitoring: 'Continue monitoring' };
const GROUPS = [['recommended', 'Recommended'], ['eligible', 'Eligible'], ['excluded', 'Excluded options']];
const lineAlerts = computed(() => orderAlerts(sug.value?.alerts ?? []));

const productId = ref(''), appliedOn = ref(todayIso());
// A new line starts with no product chosen.
const load = () => { productId.value = ''; return store.load(lineId.value); };
onMounted(load);
watch(lineId, load);
onBeforeUnmount(() => store.stop());
watch(todayIso, (next, old) => { appliedOn.value = keepIfEdited(appliedOn.value, old, next); });
// The scheduler sends a practice id as the label (PracFungicideSpraying); read it as words.
const guidanceName = (label) => label.replace(/^Prac/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
const tierOf = (u) => GROUPS.find(([g]) => store.groups[g].includes(u))?.[0];
const record = async () => { if (await store.record(productId.value, appliedOn.value) === 'recorded') productId.value = ''; };
const confirm = async () => { if (await store.confirm() === 'recorded') productId.value = ''; };
// A product in an earlier suggestion may not be a unit now: fall back to the name in its id.
const productName = (id) => store.units.find((u) => u.product_id === id)?.label ?? id.split('#').pop().replace(/^Fungicide/, '');
const assessedWeeks = computed(() => store.cycles.filter((c) => c.status === 'done').map((c) => c.week));
// Every product applied on the latest recorded date, not just the last row.
const lastApplied = computed(() => {
  const day = store.history.reduce((m, h) => (h.applied_on > m ? h.applied_on : m), '');
  const rows = store.history.filter((h) => h.applied_on === day);
  return rows.length ? { on: day, names: [...new Set(rows.map((h) => productName(h.product_id)))] } : null;
});
</script>

<template>
  <div class="page narrow">
    <PageHeader title="Treatment suggestion" :subtitle="`Line ${lineId} · ${week}`" />
    <p v-if="store.phase === 'loading'" class="empty">Loading…</p>
    <p v-else-if="store.phase === 'error'" class="error">{{ store.error }} <button class="mark" type="button" @click="load">Try again</button></p>
    <p v-else-if="store.phase === 'notfound'" class="empty">This line has no treatment suggestion yet. A scan is suggested to start one.</p>
    <template v-else-if="store.phase === 'ready' && sug">
      <p v-if="store.error" class="error">{{ store.error }}</p>
      <div class="banner" :class="sug.outcome === 'human_review_required' ? 'bad' : 'ok'">
        <span class="tick">{{ sug.outcome === 'human_review_required' ? '!' : '✓' }}</span>
        <span>{{ OUTCOME[sug.outcome] ?? BASIS[sug.basis] ?? 'Current suggestion' }}</span>
        <span v-if="store.updating" class="updating" role="status">Updating…</span>
      </div>
      <p v-if="sug.outcome_reason" class="meta reason">{{ outcomeReasonText(sug.outcome_reason) }}</p>
      <p v-if="sug.basis && sug.outcome !== 'human_review_required'" class="meta basis">{{ BASIS[sug.basis] }}</p>
      <p v-if="sug.changes?.summary" class="meta changes">What changed: {{ sug.changes.summary }}</p>

      <section class="prop-card">
        <h3>Products</h3>
        <p v-if="lastApplied" class="meta recent">Recently applied: {{ lastApplied.names.join(', ') }} on {{ lastApplied.on }}.</p>
        <p class="meta counts">{{ GROUPS.map(([g, label]) => `${store.groups[g].length} ${g}`).join(' · ') }}</p>
        <section v-if="lineAlerts.length" class="ack notes">
          <h4>Alerts</h4>
          <ul><li v-for="a in lineAlerts" :key="a.id" :class="a.level"><span class="icon" aria-hidden="true">{{ LEVEL_ICON[a.level] }}</span>{{ a.text }}</li></ul>
        </section>
        <template v-for="[g, label] in GROUPS" :key="g">
          <details v-if="store.groups[g].length" class="grp" :open="g !== 'excluded'" :data-group="g">
            <summary><b>{{ label }}</b><template v-if="g === 'excluded'"> (use caution)</template> · {{ store.groups[g].length }}</summary>
            <ul class="units">
              <li v-for="u in store.groups[g]" :id="`unit-${u.unit_id}`" :key="u.unit_id">
                <ProductCard :unit="u" :group="g" />
                <p v-if="u.needs_confirmation" class="confirm-mark">Needs confirmation to record</p>
                <ul v-if="u.alerts.length" class="ualerts"><li v-for="a in u.alerts" :key="a.id" :class="a.level"><span class="icon" aria-hidden="true">{{ LEVEL_ICON[a.level] }}</span>{{ a.text }}</li></ul>
              </li>
            </ul>
          </details>
        </template>
        <section v-if="sug.other_guidance.length" class="ack notes guidance">
          <h4>Other guidance</h4>
          <ul><li v-for="o in sug.other_guidance" :key="o.practice_id">{{ guidanceName(o.label) }}</li></ul>
        </section>
      </section>

      <section class="prop-card">
        <h3>Record an application</h3>
        <p class="meta">You can record any product; those that need confirmation ask first.</p>
        <div class="row">
          <select v-model="productId" aria-label="Product applied" :disabled="store.busy || !!store.pending">
            <option value="" disabled>Product</option>
            <option v-for="u in store.units" :key="u.unit_id" :value="u.product_id">{{ u.label }}{{ tierOf(u) === 'excluded' ? ' (excluded)' : '' }}</option>
          </select>
          <input v-model="appliedOn" type="date" :max="todayIso()" aria-label="Date applied" :disabled="store.busy || !!store.pending" />
        </div>
        <div v-if="store.pending" class="off-schedule" role="alert">
          <p>{{ productName(store.pending.product_id) }} needs your confirmation{{ store.pending.tier ? ` (${store.pending.tier})` : '' }}:</p>
          <ul><li v-for="a in store.pending.alerts" :key="a.id">{{ a.text }}</li></ul>
          <div class="btns">
            <button type="button" :disabled="store.busy" @click="confirm">Record anyway</button>
            <button type="button" class="ghost" :disabled="store.busy" @click="store.cancel()">Cancel</button>
          </div>
        </div>
        <div v-else class="btns"><button type="button" :disabled="!productId || !appliedOn || store.busy || store.updating" @click="record">Record application</button></div>
      </section>

      <ScheduleCalendar :days="store.days" :applications="store.history" :name-of="productName" :assessed-weeks="assessedWeeks" />

      <EvidenceCharts :cycle-id="sug.revision" />
    </template>
    <p class="disclaimer">AI-assisted scheduling should be verified by an agricultural specialist before treatment decisions.</p>
  </div>
</template>

<style scoped>
.narrow { max-width: 760px; }
.error { color: var(--danger); font-weight: 700; }
.empty { padding: 30px; text-align: center; color: var(--ink-soft); border: 1.5px dashed var(--line); border-radius: var(--radius-md); background: var(--card); }
.banner { display: flex; align-items: center; gap: 10px; padding: 12px 18px; margin-bottom: 14px; border-radius: 999px; background: #D5E9DB; color: var(--forest); font: 800 15px var(--font-display); }
.banner .tick { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 6px; background: var(--forest); color: #fff; font-size: 14px; }
.banner.warn { background: #FCE7C8; color: #8A5A00; } .banner.warn .tick { background: #D98A00; }
.btns { display: flex; gap: 10px; } .btns button { flex: 1; padding: 13px; border: 0; border-radius: 14px; background: var(--forest); color: #fff; font: 800 15px var(--font-display); }
.btns button.ghost { background: none; border: 1px solid var(--line); color: var(--ink); } .btns button:disabled { opacity: .45; }
.disclaimer { margin-top: 20px; font-size: 12.5px; color: var(--ink-soft); text-align: center; }
.prop-card { padding: 18px; margin-bottom: 18px; border-radius: 20px; background: var(--card); box-shadow: var(--shadow); }
.prop-card h3 { font: 800 20px var(--font-display); color: var(--forest); margin-bottom: 4px; }
.prop-card .meta { color: var(--ink-soft); font-size: 14px; margin-bottom: 10px; }
.prop-card ul { margin: 8px 0 0 18px; color: var(--ink-soft); font-size: 14px; }
.prop-card textarea { width: 100%; margin-top: 12px; padding: 10px 12px; border: 1px solid var(--line); border-radius: 12px; font: 500 14px var(--font-body); resize: vertical; }
.prop-card .btns { margin-top: 12px; }
.off-schedule { margin-top: 12px; padding: 10px 12px; border-radius: 12px; background: var(--warn-tint); color: var(--warn); } .off-schedule p { margin: 0 0 6px; font-weight: 700; } .off-schedule ul { margin: 0 0 6px; padding-left: 18px; }
.btns .danger { background: #fff; color: var(--danger); border: 1.5px solid var(--danger); }
.noted { margin-top: 10px; font-size: 14px; color: var(--ink-soft); }
.banner.bad { background: #FBE4E2; color: #A62A20; } .banner.bad .tick { background: #D8352A; }
.banner.wait { background: #E3F2F0; color: #1F7C74; } .banner.wait .tick { background: #1F7C74; }
.mark { margin-top: 10px; padding: 10px 16px; border: 0; border-radius: 12px; background: var(--forest); color: #fff; font: 800 14px var(--font-display); }
.mark:disabled { opacity: .45; }
.datefield { width: 100%; padding: 12px; margin-bottom: 14px; border: 1px solid var(--line); border-radius: 12px; font: 600 15px var(--font-body); }
.prop-card .units { margin: 10px 0 0; padding: 0; list-style: none; display: grid; gap: 10px; }
.units li { scroll-margin-top: 12px; }
.excl { margin-top: 12px; padding: 12px 14px; border: 1.5px solid var(--line); border-radius: 18px; background: #F4F4F4; } .excl summary { cursor: pointer; color: var(--forest); }
.soon { margin-top: 10px; font-size: 13px; }
.meta small { color: var(--ink-soft); }
.ack.notes { background: #E3F2F0; color: var(--ink); } .ack.notes h4 small { font: 600 12px var(--font-body); color: var(--ink-soft); margin-left: 6px; }
.ack.notes:has(.error) { background: #FBE4E2; }
.ack { margin-top: 12px; padding: 14px; border-radius: 18px; background: #FCE7C8; color: #6B4A0B; } .ack h4 { font: 800 16px var(--font-display); }
.ack ul { margin: 8px 0 0 18px; display: grid; gap: 12px; font-size: 14px; }
.ack li { min-width: 0; overflow-wrap: anywhere; }
.ack label { margin-top: 12px; }
.ack label { display: flex; gap: 8px; align-items: flex-start; margin-top: 6px; font-weight: 700; }
.icon { margin-right: 6px; }
.badge { margin-left: 8px; padding: 2px 8px; border-radius: 999px; background: #1F7C74; color: #fff; font: 800 12px var(--font-display); }
.why-off { margin-top: 10px; font-size: 14px; font-weight: 700; color: var(--danger); }
.apps { margin: 8px 0 0 18px; color: var(--ink-soft); font-size: 14px; }
.row { display: flex; gap: 8px; margin-top: 10px; } .row select, .row input { flex: 1; padding: 10px; border: 1px solid var(--line); border-radius: 12px; font: 600 14px var(--font-body); }

.banner.ok { background: #D5E9DB; } .banner .updating { margin-left: auto; font: 700 13px var(--font-body); }
.meta.reason, .meta.basis, .meta.changes { margin: 0 0 8px; } .meta ~ .prop-card { margin-top: 16px; }
.grp { margin-top: 12px; } .grp summary { cursor: pointer; color: var(--forest); }
.confirm-mark { margin: 6px 0 0; font-size: 13px; font-weight: 700; color: var(--warn); }
.ualerts { margin: 4px 0 0 18px; font-size: 13px; }
</style>