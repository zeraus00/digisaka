<script setup>
import { computed } from 'vue';
import { checkLabel, humanDetail, unitGroup, GROUP_LABEL, titleCase, explainMoa, stripChecks, RESULT_LABEL, unitFacts, reasonText } from '../helpers/checks.js';
import ProductFacts from './ProductFacts.vue';

// The scheduler names the group (recommended, eligible, excluded); a unit alone cannot say.
const props = defineProps({ unit: { type: Object, required: true }, group: { type: String, default: '' } });
const KIND = { carrier: 'Add', property: 'Needs', excluded: 'Do not mix with' };
const grp = computed(() => props.group || unitGroup(props.unit));
const strips = computed(() => stripChecks(props.unit).map((c) => ({ ...c, label: checkLabel(c.check), ...humanDetail(c.check, c.detail) })));
const all = computed(() => (props.unit.checks ?? []).map((c) => ({ ...c, label: checkLabel(c.check), ...humanDetail(c.check, c.detail) })));
const passed = computed(() => all.value.filter((c) => c.result === 'pass').length);
const facts = computed(() => unitFacts(props.unit));
</script>

<template>
  <article class="pcard" :class="grp">
    <div class="top"><h4>{{ titleCase(unit.label ?? unit.product) }}</h4><span class="pill" :class="grp">{{ GROUP_LABEL[grp] }}</span></div>
    <div class="pills">
      <span v-if="facts.frac" class="jr-pill">FRAC {{ facts.frac }}</span><span v-if="facts.site" class="jr-pill">{{ facts.site }}</span>
      <span v-for="m in facts.mobility" :key="m" class="jr-pill">{{ m }}</span><span class="jr-pill jr-off">Price: Coming soon</span>
    </div>
    <p v-if="grp === 'excluded' && unit.reason" class="why">{{ reasonText(unit.reason) }}</p>
    <ul v-if="unit.conditions?.length" class="conds"><li v-for="c in unit.conditions" :key="c.kind + c.label">{{ KIND[c.kind] ?? c.kind }}: {{ explainMoa(c.label) }}</li></ul>
    <div v-for="s in strips" :key="s.check" class="strip" :class="s.result">
      <b>{{ s.label }}:</b> {{ s.text ?? RESULT_LABEL[s.result] }}<small v-if="s.source" class="src">Source: {{ s.source }}</small>
    </div>
    <details v-if="all.length" class="all">
      <summary>{{ passed }} of {{ all.length }} checks passed · Details</summary>
      <ProductFacts :unit="unit" />
      <ul><li v-for="c in all" :key="c.check"><b>{{ c.label }}</b> — {{ RESULT_LABEL[c.result] ?? c.result }}<template v-if="c.text">. {{ c.text }}</template><small v-if="c.source" class="src">Source: {{ c.source }}</small></li></ul>
    </details>
  </article>
</template>

<style scoped>
.pcard { padding: 14px; border: 1.5px solid var(--line); border-radius: 18px; background: var(--card); }
.pcard.recommended { border: 2.5px solid var(--forest); background: #F4FAF5; } .pcard.excluded { background: #F4F4F4; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
h4 { font: 800 17px var(--font-display); color: var(--ink); }
.pill { padding: 3px 12px; border-radius: 999px; background: #E1F1E2; color: var(--forest); font: 800 12px var(--font-display); white-space: nowrap; }
.pill.eligible { background: #E3E5E8; color: #444; } .pill.excluded { background: #FBE4E2; color: #A62A20; }
.pills { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; } .why { margin: 6px 0 0; font-size: 14px; color: #A62A20; }
.conds { margin: 8px 0 0 18px; font-size: 13px; color: var(--ink-soft); }
.strip { margin-top: 8px; padding: 9px 12px; border-radius: 12px; font-size: 14px; background: #FCE7C8; color: #6B4A0B; }
.strip.fail { background: #FBE4E2; color: #A62A20; }
.src { display: block; margin-top: 2px; opacity: .85; }
.all { margin-top: 10px; font-size: 13px; } .all summary { cursor: pointer; font-weight: 700; color: var(--forest); }
.all ul { margin: 6px 0 0 18px; display: grid; gap: 4px; color: var(--ink-soft); }
</style>
