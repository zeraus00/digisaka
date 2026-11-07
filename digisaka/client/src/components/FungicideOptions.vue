<script setup>
import { computed, watch } from 'vue';
import { useSuggestionStore } from '../stores/suggestion.js';
import { unitFacts, titleCase, reasonText, checkLabel, humanDetail, stripChecks, GROUP_LABEL } from '../helpers/checks.js';
import { orderAlerts, LEVEL_ICON } from '../helpers/alerts.js';
import { paginate } from '../helpers/paging.js';
import '../styles/journey.css';

// The fungicide options as one flat list (recommended, eligible, excluded), five cards a page.
// The parent owns the page, so it survives a trip to the details view.
const page = defineModel('page', { type: Number, default: 1 });
const emit = defineEmits(['select']);
const suggestion = useSuggestionStore();
const failing = (u) => stripChecks(u).filter((c) => c.result === 'fail').map((c) => ({ label: checkLabel(c.check), ...humanDetail(c.check, c.detail) }));
const counts = computed(() => `${suggestion.groups.recommended.length + suggestion.groups.eligible.length} eligible · ${suggestion.groups.excluded.length} excluded`);
const rows = computed(() => ['recommended', 'eligible', 'excluded'].flatMap((g) => suggestion.groups[g].map((u) => ({ u, g }))));
const paged = computed(() => paginate(rows.value, page.value));
watch(() => suggestion.units, () => { page.value = 1; });
const showDetails = (u) => emit('select', u);
</script>

<template>
  <article class="jr-card">
    <div class="jr-row"><h2>Fungicide options</h2><span class="jr-hint">{{ counts }}</span></div>
    <p v-if="suggestion.suggestion?.outcome === 'continue_monitoring'" class="jr-warn">The data suggests treatment is not due yet. Monitoring is advised, but you may still record applications.</p>
    <p class="jr-warn">These are separate product choices, not a combination to mix. Compatibility has not been assessed.</p>
    <p v-if="!suggestion.units.length" class="jr-hint">No fungicide options were suggested for this line.</p>
    <div class="jr-tier">
      <template v-for="({ u, g }, i) in paged.shown" :key="u.unit_id">
        <template v-if="g !== 'excluded'">
          <button type="button" class="jr-unit combo" :aria-label="`View details for ${titleCase(u.label)}`" @click="showDetails(u)">
            <span class="top"><b>{{ titleCase(u.label) }}</b><span v-if="g === 'recommended'" class="jr-pill ok">Recommended</span></span>
            <span class="pills">
              <span v-if="unitFacts(u).frac" class="jr-pill">FRAC {{ unitFacts(u).frac }}</span><span v-if="unitFacts(u).site" class="jr-pill">{{ unitFacts(u).site }}</span>
              <span v-for="m in unitFacts(u).mobility" :key="m" class="jr-pill">{{ m }}</span>
              <span class="jr-pill jr-off">Price: Coming soon</span><span class="jr-hint more">Details →</span>
            </span>
          </button>
        </template>
        <template v-else>
          <div v-if="i === 0 || paged.shown[i - 1].g !== 'excluded'"><p class="jr-hint">Use caution</p><h3>Excluded options</h3></div>
          <button type="button" class="jr-unit excluded" :aria-label="`View excluded product details for ${titleCase(u.label)}`" @click="showDetails(u)">
            <span class="top"><b>{{ titleCase(u.label) }}</b><span class="jr-pill bad">{{ GROUP_LABEL.excluded }}</span></span>
            <span class="pills">
              <span v-if="unitFacts(u).frac" class="jr-pill">FRAC {{ unitFacts(u).frac }}</span><span v-if="unitFacts(u).site" class="jr-pill">{{ unitFacts(u).site }}</span>
              <span v-for="m in unitFacts(u).mobility" :key="m" class="jr-pill">{{ m }}</span><span class="jr-pill jr-off">Price: Coming soon</span>
            </span>
            <span>{{ reasonText(u.reason) }}</span>
            <ul v-if="failing(u).length"><li v-for="c in failing(u)" :key="c.label">{{ c.label }}: {{ c.text }}</li></ul>
            <ul v-if="u.alerts.length"><li v-for="a in orderAlerts(u.alerts)" :key="a.id"><span aria-hidden="true">{{ LEVEL_ICON[a.level] }}</span> {{ a.text }}</li></ul>
          </button>
        </template>
      </template>
    </div>
    <nav v-if="paged.pages > 1" class="jr-pager" aria-label="Fungicide options pages">
      <button type="button" :disabled="page <= 1" @click="page--">Previous</button>
      <span class="jr-hint">Page {{ page }} of {{ paged.pages }}</span>
      <button type="button" :disabled="page >= paged.pages" @click="page++">Next</button>
    </nav>
  </article>
</template>
