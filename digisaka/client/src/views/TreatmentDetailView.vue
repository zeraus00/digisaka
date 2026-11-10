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
import RecordDialog from '../components/RecordDialog.vue';
import { useSuggestionStore } from '../stores/suggestion.js';
import { useScanStore } from '../stores/scan.js';
import { entryOf, showBackToScan } from '../helpers/scanEntry.js';
import { useInsightsStore } from '../stores/insights.js';
import { STEPS, stepOf } from '../helpers/treatmentStep.js';
import '../styles/journey.css';
import { outcomeReasonText } from '../helpers/messages.js';
import { orderAlerts, LEVEL_ICON } from '../helpers/alerts.js';
import { shownName } from '../helpers/checks.js';

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
const lineAlerts = computed(() => orderAlerts(sug.value?.alerts ?? []));

const detailId = ref(''), optionPage = ref({}), optionTab = ref('single_site');
const detail = computed(() => store.units.find((u) => u.unit_id === detailId.value) ?? null);
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
  detailId.value = ''; dialog.value = null; visited.value = [step.value]; insights.load(lineId.value, week.value);
  return fromScan.value ? store.track(lineId.value, entry.value.cycleId) : store.load(lineId.value);
};
onMounted(load);
watch(lineId, load);
watch(week, () => insights.load(lineId.value, week.value));
const heading = computed(() => (step.value === 'fungicides' && detail.value ? 'Fungicide Details' : STEPS.find((s) => s.id === step.value).title));
onBeforeUnmount(() => store.stop());
// The scheduler sends a practice id as the label (PracFungicideSpraying); read it as words.
const guidanceName = (label) => label.replace(/^Prac/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
// The record dialog: for a timeline step ({entry}) or for a spray tied to no step ({entry: null}). A confirmation the scheduler asks for opens it too.
const dialog = ref(null);
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
      <div class="spray"><button type="button" @click="dialog = { entry: null }">Record a spray</button></div>

      <ScheduleCalendar :days="store.days" :applications="store.history" :name-of="productName" :assessed-weeks="assessedWeeks" :busy="store.busy || store.updating" @undo="(id) => store.undoSkip(id)" @act="(e) => (dialog = { entry: e })" />
      <RecordDialog v-if="dialog || store.pending || store.earlier" :key="dialog?.entry?.stepId ?? 'free'" :entry="dialog?.entry ?? null" :product-name="productName" @close="dialog = null" />

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
.spray { display: flex; justify-content: flex-end; margin-bottom: 12px; } .spray button { padding: 10px 18px; border: 1px solid var(--line); border-radius: 14px; background: var(--card); color: var(--forest); font: 800 14px var(--font-display); cursor: pointer; }
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