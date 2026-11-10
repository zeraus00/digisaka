<script setup>
import { computed, onMounted, onBeforeUnmount, ref, watch } from 'vue';
import { useSuggestionStore } from '../stores/suggestion.js';
import { SKIP_REASONS } from '../helpers/schedule.js';
import { reasonText, unitFacts, shownName } from '../helpers/checks.js';
import { todayIso, keepIfEdited } from '../helpers/today.js';

// The one place a spray is recorded or a step is skipped: a centred dialog, opened for a timeline step
// (`entry`) or, with no entry, for a spray tied to no step. The confirmations the scheduler asks for show here.
const props = defineProps({ entry: { type: Object, default: null }, productName: { type: Function, default: (id) => id } });
const emit = defineEmits(['close']);
const noDom = typeof document === 'undefined'; // the server renderer has no body to teleport to
const store = useSuggestionStore();
const e = props.entry;
const view = ref(e ? 'planned' : 'free'); // planned | other | skip | free
const product = ref(''), partner = ref(e?.partnerId ?? ''), on = ref(todayIso()), reason = ref('');
// The dev clock can move the default date; a date the user edited stays.
watch(todayIso, (next, old) => { on.value = keepIfEdited(on.value, old, next); });
const locked = computed(() => store.busy || !!store.pending || !!store.earlier);
const title = computed(() => (!e ? 'Record a spray' : view.value === 'skip' ? 'Skip this step' : view.value === 'other' ? 'Record another product' : 'Record this step'));
const sub = computed(() => (e ? `${e.label}${e.moa ? ` · Mode of action ${e.moa}` : ''}` : 'Not tied to a planned step'));

const GROUPS = ['recommended', 'eligible', 'excluded'];
const tierOf = (u) => GROUPS.find((g) => store.groups[g].includes(u));
const sameGroup = (u) => !!e && String(unitFacts(u).moaCode) === String(e.moa).split(' ')[0];
const choices = computed(() => (e ? [...store.units].sort((a, b) => Number(sameGroup(b)) - Number(sameGroup(a))) : store.units));
// The partner picker lists every product the server marked, the planned partner first; a mark informs and never disables.
const partnerChoices = computed(() => {
  if (!e?.partnerOptions?.length) return [];
  return [...e.partnerOptions].sort((a, b) => Number(b.product_id === e.partnerId) - Number(a.product_id === e.partnerId));
});
const showPartner = computed(() => view.value === 'planned' && partnerChoices.value.length > 0);

const close = () => { store.cancel(); emit('close'); };
const submit = async (body, ok) => { if ((await body()) === ok) emit('close'); };
const stepFields = () => (e ? { step_id: e.stepId, partner_product_id: view.value === 'planned' ? partner.value || null : null } : {});
const save = () => submit(() => store.record(view.value === 'planned' ? e.productId : product.value, on.value, undefined, stepFields()), 'recorded');
const confirm = () => submit(() => store.confirm(), 'recorded');
const skipEarlier = () => submit(() => store.skipEarlier(), 'recorded');
const skip = () => submit(() => store.skip(e.stepId, reason.value || null), 'done');
const canSave = computed(() => !!on.value && (view.value === 'planned' || !!product.value) && !store.busy && !store.updating);
const onKey = (ev) => { if (ev.key === 'Escape') close(); };
onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
</script>

<template>
  <!-- In the body, so no transformed ancestor (the page-rise animation) turns `fixed` into page-relative. The server renderer has no body. -->
  <Teleport to="body" :disabled="noDom">
  <div class="scrim" @click.self="close">
    <div class="dlg" role="dialog" aria-modal="true" aria-labelledby="rd-title">
      <header>
        <h2 id="rd-title">{{ title }}<small>{{ sub }}</small></h2>
        <button type="button" class="x" aria-label="Close" @click="close">×</button>
      </header>

      <div v-if="view === 'planned'" class="plan">
        <b>{{ e.label }}</b>
        <span>Mode of action {{ e.moa }}<template v-if="e.start"> · window {{ e.start }} to {{ e.end }}</template></span>
      </div>

      <template v-if="view === 'skip'">
        <p>The step will show as skipped. You can undo it from the timeline.</p>
        <label for="rd-reason">Reason (optional)</label>
        <select id="rd-reason" v-model="reason"><option value="">No reason</option><option v-for="(t, k) in SKIP_REASONS" :key="k" :value="k">{{ t }}</option></select>
      </template>
      <template v-else>
        <template v-if="view !== 'planned'">
          <label for="rd-product">{{ e ? 'Product applied instead' : 'Product applied' }}</label>
          <select id="rd-product" v-model="product" :disabled="locked">
            <option value="" disabled>Product</option>
            <option v-for="u in choices" :key="u.unit_id" :value="u.product_id">{{ shownName(u.label) }}{{ sameGroup(u) ? ' (same group)' : '' }}{{ tierOf(u) === 'excluded' ? ' (excluded)' : '' }}</option>
          </select>
        </template>
        <template v-if="showPartner">
          <label for="rd-partner">Partner in the same tank</label>
          <select id="rd-partner" v-model="partner" :disabled="locked">
            <option value="">No partner</option>
            <option v-for="o in partnerChoices" :key="o.product_id" :value="o.product_id">{{ shownName(productName(o.product_id)) }}{{ o.product_id === e.partnerId ? ' (planned)' : '' }}{{ o.compatible ? '' : ` (not compatible: ${o.why})` }}</option>
          </select>
        </template>
        <label for="rd-date">Date applied</label>
        <input id="rd-date" v-model="on" type="date" :max="todayIso()" :disabled="locked" />
      </template>

      <p v-if="store.error" class="error">{{ store.error }}</p>

      <div v-if="store.earlier" class="alert" role="alert">
        <p>Earlier steps are still open:</p>
        <ul><li v-for="s in store.earlier.steps" :key="s.step_id">{{ shownName(s.product) }}<template v-if="s.timing_window"> ({{ s.timing_window.start }} to {{ s.timing_window.end }})</template></li></ul>
        <div class="actions">
          <button type="button" class="main" :disabled="store.busy" @click="skipEarlier">Skip them all</button>
          <button type="button" class="ghost" :disabled="store.busy" @click="close">Record them first</button>
        </div>
      </div>
      <div v-else-if="store.pending" class="alert" role="alert">
        <p>{{ shownName(productName(store.pending.product_id)) }} needs your confirmation{{ store.pending.tier ? ` (${store.pending.tier})` : '' }}:</p>
        <p v-if="store.pending.reason">{{ reasonText(store.pending.reason) }}</p>
        <ul><li v-for="a in store.pending.alerts" :key="a.id">{{ a.text }}</li></ul>
        <div class="actions">
          <button type="button" class="main" :disabled="store.busy" @click="confirm">Record anyway</button>
          <button type="button" class="ghost" :disabled="store.busy" @click="close">Cancel</button>
        </div>
      </div>
      <div v-else-if="view === 'skip'" class="actions">
        <button type="button" class="main" :disabled="store.busy" @click="skip">Skip step</button>
        <button type="button" class="ghost" :disabled="store.busy" @click="view = 'planned'">Back</button>
      </div>
      <div v-else class="actions">
        <button type="button" class="main" :disabled="!canSave" @click="save">{{ view === 'planned' ? 'Record planned' : view === 'other' ? 'Record' : 'Record spray' }}</button>
        <button v-if="view === 'planned'" type="button" class="ghost" :disabled="store.busy" @click="view = 'other'">Choose something different</button>
        <button v-else-if="view === 'other'" type="button" class="ghost" :disabled="store.busy" @click="view = 'planned'">Back to the plan</button>
        <button v-else type="button" class="ghost" :disabled="store.busy" @click="close">Cancel</button>
        <span class="sp"></span>
        <button v-if="view === 'planned'" type="button" class="quiet" :disabled="store.busy" @click="view = 'skip'">Skip this step</button>
      </div>
    </div>
  </div>
  </Teleport>
</template>

<style scoped>
.scrim { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; padding: 16px; background: rgba(27, 42, 34, .45); }
.dlg { width: min(480px, 100%); max-height: calc(100dvh - 32px); overflow: auto; padding: 22px 22px 18px; border-radius: var(--radius-lg); background: var(--card); box-shadow: 0 20px 60px rgba(11, 59, 30, .25); }
.dlg header { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 14px; }
.dlg h2 { font: 800 18px var(--font-display); color: var(--forest); } .dlg h2 small { display: block; margin-top: 2px; font: 600 13px var(--font-body); color: var(--ink-soft); }
.x { border: 0; background: none; font-size: 22px; line-height: 1; color: var(--ink-soft); cursor: pointer; }
.plan { margin-bottom: 14px; padding: 12px 14px; border-radius: var(--radius-sm); background: var(--tint); } .plan b { display: block; } .plan span { font-size: 13px; color: var(--ink-soft); }
label { display: block; margin: 10px 0 4px; font-size: 13px; color: var(--ink-soft); }
select, input { width: 100%; padding: 10px; border: 1px solid var(--line); border-radius: var(--radius-sm); background: #fff; color: var(--ink); font: 600 14px var(--font-body); }
.actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; margin-top: 18px; } .actions .sp { flex: 1; }
.main, .ghost { padding: 11px 18px; border-radius: 14px; font: 800 14px var(--font-display); cursor: pointer; }
.main { border: 0; background: var(--forest); color: #fff; } .ghost { border: 1px solid var(--line); background: none; color: var(--ink); }
.main:disabled, .ghost:disabled { opacity: .45; }
.quiet { border: 0; background: none; padding: 0; color: var(--ink-soft); text-decoration: underline; font: 600 14px var(--font-body); cursor: pointer; }
.alert { margin-top: 12px; padding: 12px 14px; border-radius: var(--radius-sm); background: var(--warn-tint); color: var(--warn); } .alert p { margin: 0 0 6px; font-weight: 700; } .alert ul { margin: 0 0 6px; padding-left: 18px; }
.error { margin-top: 10px; color: var(--danger); font-weight: 700; }
</style>
