<script setup>
import { computed } from 'vue';
import { useInsightsStore } from '../stores/insights.js';
import InsightsSummary from './InsightsSummary.vue';
import { sentenceCase, shownName } from '../helpers/checks.js';
import { trackLabel, trackSplit } from '../helpers/tracks.js';
import { sprayBadge, dayMonth, fracHeading, shownGroups, usageLine, STATUS_LABEL } from '../helpers/insights.js';

// The Spray log step: the recorded applications and the FRAC groups' usage, as Line Insights serves them.
const insights = useInsightsStore();
const data = computed(() => insights.data);
const history = computed(() => [...(data.value?.history ?? [])].sort((a, b) => b.applied_on.localeCompare(a.applied_on)));
const usage = computed(() => data.value?.group_usage ?? []);
const split = computed(() => trackSplit(usage.value));
// The FRAC card is outlined when a group is discouraged (orange) or maxed (red), as the fork design outlines its restricted card.
const fracTone = computed(() => (usage.value.some((g) => g.status === 'maxed') ? 'bad' : usage.value.some((g) => g.status === 'discouraged') ? 'warn' : ''));
</script>

<template>
  <section v-if="data" class="jr-layout" aria-label="Spray log">
    <div>
      <article class="jr-card">
        <div class="jr-row"><h2>Spray history</h2><span class="jr-pill">{{ history.length }} recorded</span></div>
        <p v-if="data.history_coverage" class="jr-hint">{{ data.history_coverage }}</p>
        <p v-if="!history.length" class="jr-hint">No treatment applications are recorded for this line.</p>
        <ol v-else class="timeline">
          <li class="ok"><span class="date">Today</span><b>Next spray decision</b></li>
          <li v-for="h in history" :key="h.applied_on + h.product_id" :class="sprayBadge(h, usage).tone">
            <span class="date">{{ dayMonth(h.applied_on) }}</span>
            <b>{{ shownName(h.product) }}</b>
            <span class="pills">
              <span v-for="m in h.plant_mobility" :key="m" class="jr-pill">{{ sentenceCase(m) }}</span>
              <span class="jr-pill">FRAC {{ h.frac_code }}</span><span class="jr-pill">{{ trackLabel(h.track) }}</span><span v-if="h.off_plan" class="jr-pill">Off-plan</span>
              <span class="jr-pill" :class="sprayBadge(h, usage).tone">{{ sprayBadge(h, usage).label }}</span>
            </span>
          </li>
        </ol>
      </article>

      <article class="jr-card" :class="fracTone">
        <h2>{{ fracHeading(usage) }}</h2>
        <p v-if="!usage.length" class="jr-hint">No FRAC group usage is recorded.</p>
        <h3 v-if="split.multisite.length">{{ trackLabel('single_site') }} groups</h3>
        <div v-for="g in shownGroups(split.single_site)" :key="g.frac_code" class="jr-unit">
          <div class="top"><span class="jr-pill">FRAC {{ g.frac_code }}</span><span v-if="STATUS_LABEL[g.status]" class="jr-pill" :class="g.status === 'ok' ? 'ok' : g.status === 'discouraged' ? 'warn' : 'bad'">{{ STATUS_LABEL[g.status] }}</span></div>
          <!-- A group with alerts shows what the alerts explain; the count line only stands in when there is none. -->
          <template v-if="g.alerts?.length">
            <ul><li v-for="a in g.alerts" :key="a.text">{{ a.text }}<template v-if="a.alternatives?.length"> Alternatives: {{ a.alternatives.join(', ') }}.</template></li></ul>
            <p v-if="g.source" class="jr-hint">{{ g.source }}</p>
          </template>
          <p v-else>{{ usageLine(g) }}<template v-if="g.source"> · {{ g.source }}</template></p>
        </div>
        <template v-if="split.multisite.length">
          <h3>{{ trackLabel('multisite') }} groups</h3>
          <p class="jr-hint">No FRAC limit on multisites; label limits apply.</p>
          <div v-for="g in split.multisite" :key="g.frac_code" class="jr-unit"><span class="jr-pill">FRAC {{ g.frac_code }}</span> {{ g.count }} recorded<template v-if="g.source"> · {{ g.source }}</template></div>
        </template>
      </article>
      <slot />
    </div>
    <InsightsSummary />
  </section>
</template>

<style scoped>
/* The fork design's timeline: a line down the left, a dot per spray coloured by its badge, "Today" on top. */
.timeline { list-style: none; margin: 4px 0 0 8px; padding: 0 0 0 22px; border-left: 3px solid var(--line); }
.timeline li { position: relative; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 14px; padding: 12px 0; font-size: 14px; --c: var(--forest); }
.timeline li.warn { --c: #E59A0F; }
.timeline li.bad { --c: #D6455A; }
.timeline li::before { content: ''; position: absolute; left: -31px; width: 13px; height: 13px; border-radius: 50%; background: var(--c); border: 2px solid #fff; box-shadow: 0 0 0 1px var(--c); }
.date { flex: 0 0 52px; color: var(--ink-soft); font-size: 13px; }
.timeline b { flex: 1 1 110px; }
.pills { display: flex; flex-wrap: wrap; gap: 6px; }
.jr-card.warn { border: 1.5px solid #E59A0F; }
.jr-card.bad { border: 1.5px solid #D6455A; }
</style>
