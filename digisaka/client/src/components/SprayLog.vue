<script setup>
import { computed } from 'vue';
import { useInsightsStore } from '../stores/insights.js';
import InsightsSummary from './InsightsSummary.vue';
import { sprayBadge, fracHeading, usageLine, STATUS_LABEL } from '../helpers/insights.js';

// The Spray log step: the recorded applications and the FRAC groups' usage, as Line Insights serves them.
const insights = useInsightsStore();
const data = computed(() => insights.data);
const history = computed(() => [...(data.value?.history ?? [])].sort((a, b) => b.applied_on.localeCompare(a.applied_on)));
const usage = computed(() => data.value?.group_usage ?? []);
</script>

<template>
  <section v-if="data" class="jr-layout" aria-label="Spray log">
    <div>
      <article class="jr-card">
        <div class="jr-row"><h2>Spray history</h2><span class="jr-pill">{{ history.length }} recorded</span></div>
        <p v-if="data.history_coverage" class="jr-hint">{{ data.history_coverage }}</p>
        <p v-if="!history.length" class="jr-hint">No treatment applications are recorded for this line.</p>
        <ul v-else class="jr-rows">
          <li v-for="h in history" :key="h.applied_on + h.product_id" class="jr-row">
            <span>{{ h.applied_on }}</span>
            <span><b>{{ h.product }}</b><br><small>{{ h.mode_of_action }} · FRAC {{ h.frac_code }}</small></span>
            <span class="jr-pill" :class="sprayBadge(h, usage).tone">{{ sprayBadge(h, usage).label }}</span>
          </li>
        </ul>
      </article>

      <article class="jr-card">
        <h2>{{ fracHeading(usage) }}</h2>
        <p v-if="!usage.length" class="jr-hint">No FRAC group usage is recorded.</p>
        <div v-for="g in usage" :key="g.frac_code" class="jr-unit">
          <div class="top"><span><span class="jr-pill">FRAC {{ g.frac_code }}</span> {{ g.mode_of_action }}</span><span v-if="STATUS_LABEL[g.status]" class="jr-pill" :class="g.status === 'ok' ? 'ok' : g.status === 'discouraged' ? 'warn' : 'bad'">{{ STATUS_LABEL[g.status] }}</span></div>
          <p>{{ usageLine(g) }}<template v-if="g.source"> · {{ g.source }}</template></p>
          <ul v-if="g.alerts?.length"><li v-for="a in g.alerts" :key="a.text">{{ a.text }}<template v-if="a.alternatives?.length"> Alternatives: {{ a.alternatives.join(', ') }}.</template></li></ul>
        </div>
      </article>
      <slot />
    </div>
    <InsightsSummary />
  </section>
</template>
