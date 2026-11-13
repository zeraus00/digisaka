<script setup>
import { computed } from 'vue';
import { useInsightsStore } from '../stores/insights.js';
import Icon from './Icon.vue';
import InsightsSummary from './InsightsSummary.vue';
import { useSuggestionStore } from '../stores/suggestion.js';
import { rainOutlookText, conditionMark, conditionReading, weekday, dayRain } from '../helpers/insights.js';

// The Weather step: recorded rainfall, the risk finding, the 5-day outlook and what drives the assessment, all as the scheduler served them.
const props = defineProps({ line: { type: String, required: true }, week: { type: String, required: true } });
const insights = useInsightsStore();
const data = computed(() => insights.data);
// The scheduler's reading of the fired findings against the treatment requirement (ADR-0045), shown as served.
const assessment = computed(() => useSuggestionStore().suggestion?.assessment ?? null);
// The newest series entry: the week the scheduler last read, which is not the asked week.
const thisWeek = computed(() => data.value?.series.at(-1));
const readWeek = computed(() => Number((thisWeek.value?.week ?? props.week).split('W').pop()));
const rainfall = computed(() => thisWeek.value?.rainfall_mm ?? null);
const wetness = computed(() => thisWeek.value?.leaf_wetness_hours ?? null);
const risk = computed(() => data.value?.risk);
const days = computed(() => data.value?.rain_outlook?.days ?? []);
const BADGE = { fired: 'bad', not_fired: 'ok' };
</script>

<template>
  <p v-if="insights.phase === 'loading'" class="jr-hint" role="status">Loading weather and line data…</p>
  <p v-else-if="insights.phase === 'error'" class="jr-err" role="alert">{{ insights.error }} <button type="button" @click="insights.load(line, week)">Try again</button></p>
  <section v-else-if="data" class="jr-layout" aria-label="Weather and risk">
    <div>
      <div class="jr-metrics jr-card">
        <article class="jr-metric"><span>Recorded rainfall</span><strong>{{ rainfall == null ? '—' : `${rainfall} mm` }}</strong><small>{{ rainfall == null ? `No rainfall value recorded for week ${readWeek}` : `Week ${readWeek}` }}</small></article>
        <!-- TODO(contract): humidity -->
        <article class="jr-metric jr-off"><span>Humidity</span><strong>Coming soon</strong><small>The scheduler does not provide this yet</small></article>
        <article class="jr-metric"><span>Leaf wetness</span><strong>{{ wetness == null ? '—' : `${wetness} h` }}</strong><small>{{ wetness == null ? `No leaf wetness value recorded for week ${readWeek}` : `Week ${readWeek}` }}</small></article>
      </div>

      <article class="jr-card">
        <h2>Weather risk signal</h2>
        <p><span class="jr-pill" :class="BADGE[risk?.result]">{{ risk?.finding ?? 'Not assessed' }}</span></p>
        <!-- TODO(contract): infection risk level -->
        <p class="jr-off">Infection risk level: Coming soon</p>
        <div class="jr-days" aria-label="Next 5 days">
          <div v-for="d in days" :key="d.date"><span>{{ weekday(d.date) }}</span><b>{{ dayRain(d) }}</b></div>
        </div>
        <p class="jr-hint">{{ rainOutlookText(data.rain_outlook) }}</p>
        <p class="jr-hint">This is not a forecast or a probability of infection.</p>
      </article>

      <article class="jr-card">
        <h2>What is driving the assessment</h2>
        <ul v-if="risk?.conditions?.length" class="jr-rows">
          <li v-for="c in risk.conditions" :key="c.label" class="jr-row">
            <span class="jr-mark" :class="c.result" role="img" :aria-label="conditionMark(c.result)[1]"><Icon v-if="conditionMark(c.result)[0]" :name="conditionMark(c.result)[0]" :size="16" /></span>
            <span class="jr-label">{{ c.label }}</span>
            <b>{{ c.result === 'cannot_check' ? conditionMark(c.result)[1] : conditionReading(c.input, c.label) }}</b>
          </li>
        </ul>
        <div v-for="r in data.readings" :key="r.rule" class="jr-indent"><b>{{ r.finding }}</b><p class="jr-hint">{{ r.text }}<template v-if="r.source"> · {{ r.source }}</template></p></div>
        <p v-if="!risk?.conditions?.length && !data.readings?.length" class="jr-hint">Nothing was assessed for this week.</p>
        <p v-if="assessment" class="jr-hint"><b>{{ assessment.note }}</b><template v-if="assessment.caveat"> {{ assessment.caveat }}</template></p>
      </article>
    </div>
    <InsightsSummary />
  </section>
</template>
