<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import EvidenceCharts from '../components/EvidenceCharts.vue';
import AlertWhy from '../components/AlertWhy.vue';
import ProductCard from '../components/ProductCard.vue';
import ScheduleCalendar from '../components/ScheduleCalendar.vue';
import { useSelectionStore, productOf } from '../stores/selection.js';
import { outcomeReasonText } from '../helpers/messages.js';
import { unitGroup } from '../helpers/checks.js';
import { orderAlerts, approveState, LEVEL_ICON } from '../helpers/alerts.js';
import { todayIso, keepIfEdited } from '../helpers/today.js';

const route = useRoute(), store = useSelectionStore();
const lineId = computed(() => String(route.params.lineId));
const week = computed(() => String(route.params.week));

const sel = computed(() => store.selection);

const period = computed(() => sel.value?.approval_period);
// The units in the Selection are the products an application can be recorded for.
const products = computed(() => (sel.value?.units ?? []).filter((u) => u.selectable !== false && !u.excluded_from_schedule));
const byGroup = (g) => (sel.value?.units ?? []).filter((u) => unitGroup(u) === g);
const shown = computed(() => [...byGroup('recommended'), ...byGroup('eligible')]);
const excluded = computed(() => byGroup('excluded'));
const alerts = computed(() => orderAlerts(store.preview?.alerts ?? []));
const ackAlerts = computed(() => alerts.value.filter((a) => a.id && requiredIds.value.includes(a.id)));
const otherAlerts = computed(() => alerts.value.filter((a) => !ackAlerts.value.includes(a)));
const unitOf = (a) => a.unit_id ?? store.required.find((r) => r.id === a.id)?.unit_id;
const unitName = (a) => sel.value?.units.find((u) => u.unit_id === unitOf(a));
const requiredIds = computed(() => store.required.map((a) => a.id));

const STATUS = { draft: 'Awaiting your decision', approved: 'Approved', rejected: 'Rejected', superseded: 'Replaced by a newer selection', ended: 'Approval period ended' };
const BANNER = computed(() => {
  const s = store.status;
  if (s === 'approved') return { cls: 'ok', icon: '✓', text: `Approved from ${period.value.start} to ${period.value.end}` };
  if (s === 'rejected') return { cls: 'bad', icon: '!', text: `Human Review Required${store.cycle?.outcome_reason ? ` — ${outcomeReasonText(store.cycle.outcome_reason)}` : ''}` };
  if (s === 'draft') return { cls: 'wait', icon: '•', text: STATUS.draft };
  return { cls: 'warn', icon: '•', text: STATUS[s] ?? s };
});

const note = ref(''), acked = ref([]), productId = ref(''), appliedOn = ref(todayIso());
// A new line-week starts with nothing acknowledged and no product chosen.
const load = () => { acked.value = []; productId.value = ''; return store.load(lineId.value, week.value); };
onMounted(load);
watch([lineId, week], load);
onBeforeUnmount(() => store.run++);
const allAcked = computed(() => requiredIds.value.every((id) => acked.value.includes(id)));
// One tickbox covers every required item; the store still receives the ids.
const ackAll = computed({ get: () => requiredIds.value.length > 0 && allAcked.value, set: (on) => { acked.value = on ? [...requiredIds.value] : []; } });
const gate = computed(() => approveState({ approvable: sel.value?.approvable, blockers: sel.value?.blockers, required: requiredIds.value, acked: acked.value }));
const canApprove = computed(() => gate.value.ok && !store.busy);
async function done(work) { await work; if (!store.error) { note.value = ''; acked.value = []; } }
const approve = () => done(store.approve(acked.value, note.value));
const reject = () => done(store.reject(note.value));
const renew = () => done(store.renew(acked.value, note.value));
watch(todayIso, (next, old) => { appliedOn.value = keepIfEdited(appliedOn.value, old, next); });
const record = () => store.apply(productId.value, appliedOn.value);
// A product in an earlier week's Selection may not be a unit now: fall back to the name in its id.
const productName = (id) => (sel.value?.units ?? []).find((u) => productOf(u.unit_id) === id)?.product ?? id.split('#').pop().replace(/^Fungicide/, '');
const lastApplied = computed(() => store.history[store.history.length - 1] ?? null);
</script>

<template>
  <div class="page narrow">
    <PageHeader title="Treatment selection" :subtitle="`Line ${lineId} · ${week}`" />
    <p v-if="store.phase === 'loading'" class="empty">Loading…</p>
    <p v-else-if="store.phase === 'error'" class="error">{{ store.error }} <button class="mark" type="button" @click="load">Try again</button></p>
    <p v-else-if="store.phase === 'notfound'" class="empty">This week's treatment couldn't be found.</p>
    <template v-else-if="store.phase === 'ready' && sel">
      <p v-if="store.error" class="error">{{ store.error }}</p>
      <div class="banner" :class="BANNER.cls"><span class="tick">{{ BANNER.icon }}</span>{{ BANNER.text }}</div>

      <section class="prop-card">
        <h3>Products</h3>
        <p class="meta">{{ period.start ? `Approval period ${period.start} to ${period.end} (${period.days} days)` : 'Not approved yet — no approval period.' }}</p>
        <p v-if="lastApplied" class="meta recent">Recently applied: {{ productName(lastApplied.product_id) }} on {{ lastApplied.applied_on }}.<template v-if="excluded.some((u) => (u.checks ?? []).some((c) => c.check === 'rotation'))"> Products of the same practice are listed under excluded, to rotate.</template></p>
        <p class="meta counts">{{ byGroup('recommended').length }} recommended · {{ byGroup('eligible').length }} eligible · {{ excluded.length }} excluded</p>
        <ul class="units">
          <li v-for="u in shown" :id="`unit-${u.unit_id}`" :key="u.unit_id"><ProductCard :unit="u" /></li>
        </ul>
        <details v-if="excluded.length" class="excl">
          <summary><b>{{ excluded.length }} excluded</b> · Show why</summary>
          <ul class="units">
            <li v-for="u in excluded" :id="`unit-${u.unit_id}`" :key="u.unit_id"><ProductCard :unit="u" /></li>
          </ul>
        </details>
        <p class="meta soon">Recommended products are the schedule's pick. Choosing among the eligible ones yourself is planned, not available yet.</p>
        <section v-if="ackAlerts.length" class="ack">
          <h4>Needs your acknowledgement</h4>
          <ul>
            <li v-for="a in ackAlerts" :key="a.id">
              <span class="icon" aria-hidden="true">{{ LEVEL_ICON[a.level] }}</span>{{ a.text }}
              <span v-if="a.new_since_approval" class="badge">New since approval</span>
              <AlertWhy :alert="a" :unit="unitName(a)" :unit-id="unitOf(a)" :build="store.payload.kg_build" />
            </li>
          </ul>
          <label v-if="['draft', 'approved'].includes(store.status)">
            <input v-model="ackAll" type="checkbox" :disabled="store.busy" /> I acknowledge this
          </label>
        </section>
        <section v-if="otherAlerts.length" class="ack notes">
          <h4>Other alerts <small>No acknowledgement needed</small></h4>
          <ul>
            <li v-for="a in otherAlerts" :key="a.id ?? a.text" :class="a.level">
              <span class="icon" aria-hidden="true">{{ LEVEL_ICON[a.level] }}</span>{{ a.text }}
              <span v-if="a.new_since_approval" class="badge">New since approval</span>
              <AlertWhy :alert="a" :unit="unitName(a)" :unit-id="unitOf(a)" :build="store.payload.kg_build" />
            </li>
          </ul>
        </section>
        <p v-if="store.status === 'draft' && !gate.ok" class="why-off">{{ gate.reason }}</p>
        <template v-if="store.status === 'draft' || store.status === 'approved'">
          <textarea v-model="note" rows="2" placeholder="Note (optional)" aria-label="Decision note"></textarea>
          <div class="btns">
            <template v-if="store.status === 'draft'">
              <button class="danger" type="button" :disabled="store.busy" @click="reject">Reject</button>
              <button type="button" :disabled="!canApprove" @click="approve">Approve</button>
            </template>
            <button v-else type="button" :disabled="!allAcked || store.busy" @click="renew">Renew for 30 days</button>
          </div>
        </template>
        <p v-else-if="sel.note" class="noted">Note: {{ sel.note }}</p>
      </section>

      <section v-if="store.status === 'approved'" class="prop-card">
        <h3>Applications</h3>
        <div class="row">
          <select v-model="productId" aria-label="Product applied"><option value="" disabled>Product</option><option v-for="u in products" :key="u.unit_id" :value="u.unit_id">{{ u.product }}</option></select>
          <input v-model="appliedOn" type="date" :max="todayIso()" aria-label="Date applied" />
        </div>
        <div class="btns"><button type="button" :disabled="!productId || !appliedOn || store.busy" @click="record">Record application</button></div>
      </section>

      <ScheduleCalendar :days="store.preview?.days ?? []" :applications="store.history" :name-of="productName" />

      <EvidenceCharts :cycle-id="store.cycle?.cycle_id ?? ''" />
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
</style>