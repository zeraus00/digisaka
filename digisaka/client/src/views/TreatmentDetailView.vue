<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute, useRouter, RouterLink } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import EvidenceCharts from '../components/EvidenceCharts.vue';
import FungicideOptions from '../components/FungicideOptions.vue';
import FungicideDetails from '../components/FungicideDetails.vue';
import Icon from '../components/Icon.vue';
import WeatherRisk from '../components/WeatherRisk.vue';
import SprayLog from '../components/SprayLog.vue';
import SuggestionUpdate from '../components/SuggestionUpdate.vue';
import InsightsSummary from '../components/InsightsSummary.vue';
import ScheduleCalendar from '../components/ScheduleCalendar.vue';
import { useSuggestionStore } from '../stores/suggestion.js';
import { useScanStore } from '../stores/scan.js';
import { entryOf, showBackToScan } from '../helpers/scanEntry.js';
import { useInsightsStore } from '../stores/insights.js';
import { STEPS, stepOf } from '../helpers/treatmentStep.js';
import '../styles/journey.css';
import { outcomeReasonText } from '../helpers/messages.js';
import { orderAlerts, LEVEL_ICON } from '../helpers/alerts.js';
import { reasonText, unitFacts, shownName } from '../helpers/checks.js';
import { todayIso, keepIfEdited } from '../helpers/today.js';

const route = useRoute(), router = useRouter(), store = useSuggestionStore(), insights = useInsightsStore(), scan = useScanStore();
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

const detailId = ref(''), optionPage = ref({}), optionTab = ref('single_site');
const detail = computed(() => store.units.find((u) => u.unit_id === detailId.value) ?? null);
const productId = ref(''), appliedOn = ref(todayIso());
// The open step lives in `?step=`; a tab rewrites it in place so back leaves the screen.
const step = computed(() => stepOf(route.query.step));
const open = (id) => router.replace({ query: { ...route.query, step: id } });
const visited = ref([]);
watch(step, (id) => { if (!visited.value.includes(id)) visited.value.push(id); }, { immediate: true });
// A new line starts with no product chosen.
// A scan of this line and week with a started run is followed, not started again; the Fungicide History tab shows that update.
const entry = computed(() => entryOf({ scan, line: lineId.value, week: week.value }));
const fromScan = computed(() => entry.value.kind === 'follow');
const backToScan = computed(() => showBackToScan({ scan, line: lineId.value, week: week.value }));
const load = () => {
  productId.value = ''; detailId.value = ''; visited.value = [step.value]; insights.load(lineId.value, week.value);
  return fromScan.value ? store.track(lineId.value, entry.value.cycleId) : store.load(lineId.value);
};
onMounted(load);
watch(lineId, load);
watch(week, () => insights.load(lineId.value, week.value));
const heading = computed(() => (step.value === 'fungicides' && detail.value ? 'Fungicide Details' : STEPS.find((s) => s.id === step.value).title));
onBeforeUnmount(() => store.stop());
watch(todayIso, (next, old) => { appliedOn.value = keepIfEdited(appliedOn.value, old, next); });
// The scheduler sends a practice id as the label (PracFungicideSpraying); read it as words.
const guidanceName = (label) => label.replace(/^Prac/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
const tierOf = (u) => GROUPS.find(([g]) => store.groups[g].includes(u))?.[0];
// The step action in progress: Record (the step's own product) or Choose something different (any product, the same group first).
const act = ref(null), actProduct = ref(''), actPartner = ref(''), actOn = ref(todayIso());
const submit = async (body) => { const out = await body(); if (out === 'recorded') { productId.value = ''; act.value = null; } };
const record = () => submit(() => store.record(productId.value, appliedOn.value));
const confirm = () => submit(() => store.confirm());
const skipEarlier = () => submit(() => store.skipEarlier());
const openAct = (mode, e) => { store.cancel(); act.value = { mode, e }; actProduct.value = mode === 'record' ? e.productId : ''; actPartner.value = mode === 'record' ? e.partnerId ?? '' : ''; actOn.value = todayIso(); };
const closeAct = () => { store.cancel(); act.value = null; };
const saveAct = () => submit(() => store.record(actProduct.value, actOn.value, undefined, { step_id: act.value.e.stepId, partner_product_id: act.value.mode === 'record' ? actPartner.value || null : null }));
// The partner picker lists every product the server marked, the planned partner first; a mark informs and never disables.
const partnerChoices = computed(() => {
  const e = act.value?.e; if (!e?.partnerOptions?.length) return [];
  return [...e.partnerOptions].sort((a, b) => Number(b.product_id === e.partnerId) - Number(a.product_id === e.partnerId));
});
const group = (u) => unitFacts(u).moaCode;
const sameGroup = (u) => String(group(u)) === String(act.value?.e.moa).split(' ')[0];
const choices = computed(() => [...store.units].sort((a, b) => Number(sameGroup(b)) - Number(sameGroup(a))));
// The free selector is a secondary link; it opens by itself when no step is open.
const hasOpen = computed(() => store.days.some((d) => ['planned', 'due', 'overdue'].includes(d.application?.status)));
const freeOpen = ref(false);
const showFree = computed(() => !act.value && (freeOpen.value || !hasOpen.value || !!store.pending || !!store.earlier));
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
  <div class="page">
    <RouterLink v-if="backToScan" class="back-scan" to="/scan">← Back to scan results</RouterLink>
    <PageHeader title="Treatment Suggestion" :subtitle="`Line ${lineId} · ${week}`" />
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

    </template>

    <ol class="tabs" role="tablist" aria-label="Treatment review steps">
      <li v-for="s in STEPS" :key="s.id">
        <button type="button" role="tab" :aria-selected="step === s.id" :aria-label="s.label" :title="s.label" :class="{ done: step !== s.id && visited.includes(s.id) }" @click="open(s.id)">
          <Icon :name="s.icon" :size="22" />
        </button>
      </li>
    </ol>
    <h2 class="step-title">{{ heading }}</h2>

    <div role="tabpanel" :aria-label="heading">
      <template v-if="step === 'weather'">
        <WeatherRisk :line="lineId" :week="week" />
        <div class="btns go"><button type="button" @click="open('spray')">Continue to Fungicide History</button></div>
      </template>
      <template v-else-if="step === 'spray'">
        <SprayLog>
          <SuggestionUpdate v-if="fromScan" :line="lineId" :week="week" :reschedule="scan.reschedule" :link="false" :show-done="false" />
        </SprayLog>
        <div class="btns go"><button type="button" @click="open('fungicides')">Continue to Fungicides</button></div>
      </template>
      <template v-else-if="store.phase === 'ready' && sug">
        <div v-if="step === 'fungicides'" class="jr-layout">
          <div>
      <section class="prop-card">
                <p v-if="lastApplied" class="meta recent">Recently applied: {{ lastApplied.names.map(shownName).join(', ') }} on {{ lastApplied.on }}.</p>
        <section v-if="lineAlerts.length" class="ack notes">
          <h4>Alerts</h4>
          <ul><li v-for="a in lineAlerts" :key="a.id" :class="a.level"><span class="icon" aria-hidden="true">{{ LEVEL_ICON[a.level] }}</span>{{ a.text }}</li></ul>
        </section>
        <section v-if="!detail && sug.explanation" class="ack notes explanation">
          <h4>Why this order</h4>
          <p>{{ sug.explanation.text }}</p>
          <p class="meta caveat">{{ sug.explanation.caveat }}</p>
        </section>
        <template v-if="detail">
          <FungicideDetails :unit="detail" />
          <div class="btns"><button type="button" class="ghost" @click="detailId = ''">Back to options</button></div>
        </template>
        <FungicideOptions v-else v-model:page="optionPage" v-model:tab="optionTab" @select="(u) => (detailId = u.unit_id)" />
        <section v-if="sug.other_guidance.length" class="ack notes guidance">
          <h4>Other guidance</h4>
          <ul><li v-for="o in sug.other_guidance" :key="o.practice_id">{{ guidanceName(o.label) }}</li></ul>
        </section>
      </section>

          </div>
          <InsightsSummary />
        </div>
        <div v-if="step === 'fungicides'" class="btns go"><button type="button" @click="open('schedule')">Continue to Schedule</button></div>
        <template v-else>
      <section v-if="act" class="prop-card">
        <h3>{{ act.mode === 'record' ? 'Record' : 'Choose something different for' }} {{ act.e.label }}</h3>
        <div class="row">
          <select v-if="act.mode === 'other'" v-model="actProduct" aria-label="Product applied instead" :disabled="store.busy || !!store.pending || !!store.earlier">
            <option value="" disabled>Product</option>
            <option v-for="u in choices" :key="u.unit_id" :value="u.product_id">{{ shownName(u.label) }}{{ sameGroup(u) ? ' (same group)' : '' }}{{ tierOf(u) === 'excluded' ? ' (excluded)' : '' }}</option>
          </select>
          <select v-if="partnerChoices.length" v-model="actPartner" aria-label="Partner in the same tank" :disabled="store.busy || !!store.pending || !!store.earlier">
            <option value="">No partner</option>
            <option v-for="o in partnerChoices" :key="o.product_id" :value="o.product_id">{{ shownName(productName(o.product_id)) }}{{ o.product_id === act.e.partnerId ? ' (planned)' : '' }}{{ o.compatible ? '' : ` (not compatible: ${o.why})` }}</option>
          </select>
          <input v-model="actOn" type="date" :max="todayIso()" aria-label="Date applied" :disabled="store.busy || !!store.pending || !!store.earlier" />
        </div>
        <div v-if="store.earlier" class="off-schedule" role="alert">
          <p>Earlier steps are still open:</p>
          <ul><li v-for="s in store.earlier.steps" :key="s.step_id">{{ shownName(s.product) }}<template v-if="s.timing_window"> ({{ s.timing_window.start }} to {{ s.timing_window.end }})</template></li></ul>
          <div class="btns">
            <button type="button" :disabled="store.busy" @click="skipEarlier">Skip them all</button>
            <button type="button" class="ghost" :disabled="store.busy" @click="closeAct">Record them first</button>
          </div>
        </div>
        <div v-else-if="store.pending" class="off-schedule" role="alert">
          <p>{{ shownName(productName(store.pending.product_id)) }} needs your confirmation{{ store.pending.tier ? ` (${store.pending.tier})` : '' }}:</p>
          <p v-if="store.pending.reason">{{ reasonText(store.pending.reason) }}</p>
          <ul><li v-for="a in store.pending.alerts" :key="a.id">{{ a.text }}</li></ul>
          <div class="btns">
            <button type="button" :disabled="store.busy" @click="confirm">Record anyway</button>
            <button type="button" class="ghost" :disabled="store.busy" @click="closeAct">Cancel</button>
          </div>
        </div>
        <div v-else class="btns">
          <button type="button" :disabled="!actProduct || !actOn || store.busy || store.updating" @click="saveAct">Save</button>
          <button type="button" class="ghost" :disabled="store.busy" @click="closeAct">Cancel</button>
        </div>
      </section>

      <section v-if="showFree" class="prop-card">
        <h3>Record an application</h3>
        <p class="meta">You can record any product; those that need confirmation ask first.</p>
        <div class="row">
          <select v-model="productId" aria-label="Product applied" :disabled="store.busy || !!store.pending">
            <option value="" disabled>Product</option>
            <option v-for="u in store.units" :key="u.unit_id" :value="u.product_id">{{ shownName(u.label) }}{{ tierOf(u) === 'excluded' ? ' (excluded)' : '' }}</option>
          </select>
          <input v-model="appliedOn" type="date" :max="todayIso()" aria-label="Date applied" :disabled="store.busy || !!store.pending" />
        </div>
        <div v-if="store.earlier" class="off-schedule" role="alert">
          <p>Earlier steps are still open:</p>
          <ul><li v-for="s in store.earlier.steps" :key="s.step_id">{{ shownName(s.product) }}</li></ul>
          <div class="btns">
            <button type="button" :disabled="store.busy" @click="skipEarlier">Skip them all</button>
            <button type="button" class="ghost" :disabled="store.busy" @click="store.cancel()">Record them first</button>
          </div>
        </div>
        <div v-else-if="store.pending" class="off-schedule" role="alert">
          <p>{{ shownName(productName(store.pending.product_id)) }} needs your confirmation{{ store.pending.tier ? ` (${store.pending.tier})` : '' }}:</p>
          <p v-if="store.pending.reason">{{ reasonText(store.pending.reason) }}</p>
          <ul><li v-for="a in store.pending.alerts" :key="a.id">{{ a.text }}</li></ul>
          <div class="btns">
            <button type="button" :disabled="store.busy" @click="confirm">Record anyway</button>
            <button type="button" class="ghost" :disabled="store.busy" @click="store.cancel()">Cancel</button>
          </div>
        </div>
        <div v-else class="btns"><button type="button" :disabled="!productId || !appliedOn || store.busy || store.updating" @click="record">Record application</button></div>
      </section>

      <p v-else-if="!act" class="meta"><button type="button" class="link" @click="freeOpen = true">Record another spray</button></p>

      <ScheduleCalendar :days="store.days" :applications="store.history" :name-of="productName" :assessed-weeks="assessedWeeks" :busy="store.busy || store.updating" @skip="(id, reason) => store.skip(id, reason)" @undo="(id) => store.undoSkip(id)" @record="(e) => openAct('record', e)" @other="(e) => openAct('other', e)" />

      <EvidenceCharts :cycle-id="sug.revision" :line="lineId" :week="week" />
        </template>
      </template>
    </div>
  </div>
</template>

<style scoped>
.error { color: var(--danger); font-weight: 700; }
.empty { padding: 30px; text-align: center; color: var(--ink-soft); border: 1.5px dashed var(--line); border-radius: var(--radius-md); background: var(--card); }
.banner { display: flex; align-items: center; gap: 10px; padding: 12px 18px; margin-bottom: 14px; border-radius: 999px; background: #D5E9DB; color: var(--forest); font: 800 15px var(--font-display); }
.banner .tick { display: grid; place-items: center; width: 22px; height: 22px; border-radius: 6px; background: var(--forest); color: #fff; font-size: 14px; }
.banner.warn { background: #FCE7C8; color: #8A5A00; } .banner.warn .tick { background: #D98A00; }
.btns { display: flex; gap: 10px; } .btns button { flex: 1; padding: 13px; border: 0; border-radius: 14px; background: var(--forest); color: #fff; font: 800 15px var(--font-display); }
.btns button.ghost { background: none; border: 1px solid var(--line); color: var(--ink); } .btns button:disabled { opacity: .45; }
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
.excl { margin-top: 12px; padding: 12px 14px; border: 1.5px solid var(--line); border-radius: 18px; background: #F4F4F4; } .excl summary { cursor: pointer; color: var(--forest); }
.soon { margin-top: 10px; font-size: 13px; }
.meta small { color: var(--ink-soft); }
.ack.notes { background: #E3F2F0; color: var(--ink); } .ack.notes h4 small { font: 600 12px var(--font-body); color: var(--ink-soft); margin-left: 6px; }
.ack.notes:has(.error) { background: #FBE4E2; }
.ack.notes:not(.guidance) { margin-bottom: 12px; }
.ack { margin-top: 12px; padding: 14px; border-radius: 18px; background: #FCE7C8; color: #6B4A0B; } .ack h4 { font: 800 16px var(--font-display); }
.ack ul { margin: 8px 0 0 18px; display: grid; gap: 12px; font-size: 14px; }
.ack li { min-width: 0; overflow-wrap: anywhere; }
.ack label { margin-top: 12px; }
.ack label { display: flex; gap: 8px; align-items: flex-start; margin-top: 6px; font-weight: 700; }
.icon { margin-right: 6px; }
.badge { margin-left: 8px; padding: 2px 8px; border-radius: 999px; background: #1F7C74; color: #fff; font: 800 12px var(--font-display); }
.why-off { margin-top: 10px; font-size: 14px; font-weight: 700; color: var(--danger); }
.apps { margin: 8px 0 0 18px; color: var(--ink-soft); font-size: 14px; }
.link { border: 0; background: none; padding: 0; color: var(--forest); text-decoration: underline; font: 700 14px var(--font-body); cursor: pointer; }
.row { display: flex; gap: 8px; margin-top: 10px; } .row select, .row input { flex: 1; padding: 10px; border: 1px solid var(--line); border-radius: 12px; font: 600 14px var(--font-body); }

.banner.ok { background: #D5E9DB; } .banner .updating { margin-left: auto; font: 700 13px var(--font-body); }
.meta.reason, .meta.basis, .meta.changes { margin: 0 0 8px; } .meta ~ .prop-card { margin-top: 16px; }

.tabs { display: flex; gap: 6px; list-style: none; padding: 4px; margin: 14px 0 12px; background: #E6ECE7; border-radius: 999px; }
.tabs li { flex: 1; display: flex; }
.tabs button { position: relative; flex: 1; display: grid; place-items: center; min-height: 44px; border: 0; border-radius: 999px; background: none; color: var(--ink-soft); cursor: pointer; }
.tabs button[aria-selected=true] { background: var(--forest); color: #fff; }
.tabs button:focus-visible { outline: 3px solid #1B6FD6; outline-offset: 2px; }
.step-title { font: 800 20px var(--font-display); color: var(--forest); margin-bottom: 12px; }
.btns.go { margin: 0 0 16px; } .btns.go button { flex: none; padding: 12px 18px; }
.back-scan { display: inline-block; margin-bottom: 8px; color: var(--forest); font-weight: 700; }
</style>