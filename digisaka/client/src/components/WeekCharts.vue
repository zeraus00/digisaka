<script setup>
import { computed, nextTick, ref, watch } from 'vue';
import Icon from './Icon.vue';
import { diseaseCaption, rainfallCaption, linePath, niceMax, TREND_VIEWS, leavesLines, leavesCaption, axisTop, availableViews, resolveView, nextView } from '../helpers/evidence.js';

// Weekly YLS/YLI and rainfall as plain SVG. With `disease` and `rainfall` (a cycle's evidence) the compared
// weeks are highlighted and captioned; without them it is a plain look at recent weeks.
const props = defineProps({ weeks: { type: Array, required: true }, disease: { type: Object, default: null }, rainfall: { type: Object, default: null },
  leaves: { type: Object, default: null }, // served {critical, target} for the Leaves view
  initialView: { type: String, default: 'all' } }); // initialView: tests only; the row always starts on All

const W = 320, H = 150, L = 34, R = 10, T = 10, B = 28, RAIN_L = 46;
const hoveredPoint = ref(null);
const allTooltipText = ref(null), leavesTooltipText = ref(null), diseaseTooltipText = ref(null), rainfallTooltipText = ref(null);
const tooltipWidth = ref(0);
const weeks = computed(() => props.weeks);
const label = (w) => `W${w.slice(-2)}`;
const x = (i) => (weeks.value.length < 2 ? (L + W - R) / 2 : L + (i * (W - L - R)) / (weeks.value.length - 1));
const pointDetails = (chart, w, seriesName, value, pointX, pointY) => ({
  chart, key: `${chart}-${w.week}-${seriesName}`, week: w.week, seriesName, value, x: pointX, y: pointY,
});
const activePoint = computed(() => hoveredPoint.value);
const hoverPoint = (...args) => { hoveredPoint.value = pointDetails(...args); };
const clearHover = (chart, key) => {
  if (hoveredPoint.value?.chart === chart && (!key || hoveredPoint.value.key === key)) hoveredPoint.value = null;
};
const clearChartHover = (chart) => clearHover(chart);
const tooltipX = computed(() => {
  const half = tooltipWidth.value / 2;
  return Math.max(half + 4, Math.min(W - half - 4, activePoint.value?.x ?? 0));
});
const tooltipY = computed(() => Math.max(20, (activePoint.value?.y ?? 0) - 13));
const pointText = computed(() => activePoint.value
  ? `${activePoint.value.week} · ${activePoint.value.seriesName}: ${activePoint.value.value}${activePoint.value.chart === 'rainfall' ? ' mm' : ''}`
  : '');
watch(pointText, async (text) => {
  await nextTick();
  const element = view.value === 'all' ? allTooltipText.value : activePoint.value?.chart === 'leaves' ? leavesTooltipText.value : activePoint.value?.chart === 'rainfall' ? rainfallTooltipText.value : diseaseTooltipText.value;
  tooltipWidth.value = text && element
    ? element.getComputedTextLength() + 12
    : 0;
});

// Disease chart: the axis runs so that the worsening direction is always down.
const lowerIsWorse = computed(() => props.disease?.worsening_direction !== 'higher');
const diseaseValues = computed(() => weeks.value.flatMap((w) => [w.yls, w.yli]).filter((v) => v != null));
const lo = computed(() => Math.min(...diseaseValues.value, 0));
const hi = computed(() => Math.max(...diseaseValues.value, 1));
const yD = (v) => {
  const t = (v - lo.value) / (hi.value - lo.value || 1);
  return T + (lowerIsWorse.value ? 1 - t : t) * (H - T - B);
};
const series = (key) => weeks.value.map((w, i) => (w[key] == null ? null : { x: x(i), y: yD(w[key]) }));
const ylsPts = computed(() => series('yls'));
const yliPts = computed(() => series('yli'));
const compared = computed(() => new Set(props.disease?.compared_weeks ?? []));
const ticks = computed(() => [lo.value, Math.round((lo.value + hi.value) / 2), hi.value]);

// Rainfall chart.
const rainTop = computed(() => niceMax(Math.max(0, ...weeks.value.map((w) => w.rainfall_mm ?? 0), props.rainfall?.min_total_mm ?? 0)));
const rainX = (i) => (weeks.value.length < 2 ? (RAIN_L + W - R) / 2 : RAIN_L + (i * (W - RAIN_L - R)) / (weeks.value.length - 1));
const yR = (v) => T + (1 - v / rainTop.value) * (H - T - B);
const barW = computed(() => Math.min(24, ((W - RAIN_L - R) / Math.max(weeks.value.length, 1)) * 0.6));
const group = (w) => (!props.rainfall || props.rainfall.recent_weeks.includes(w) ? 'recent' : props.rainfall.previous_weeks.includes(w) ? 'previous' : 'other');
const minLine = computed(() => (props.rainfall?.min_total_mm > 0 ? props.rainfall.min_total_mm / Math.max(props.rainfall.window_weeks, 1) : 0));

const views = TREND_VIEWS;
const available = computed(() => availableViews(weeks.value));
const picked = ref(props.initialView);
const view = computed(() => resolveView(picked.value, weeks.value));
const drawn = computed(() => ({ yls: ylsPts.value.some(Boolean), yli: yliPts.value.some(Boolean), rain: weeks.value.some((w) => w.rainfall_mm != null), leaves: weeks.value.some((w) => w.leaves != null) }));
const pick = (id) => { picked.value = id; };
const buttons = ref([]);
const onKey = async (e) => {
  const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
  if (!step) return;
  e.preventDefault();
  picked.value = nextView(view.value, step, weeks.value);
  await nextTick();
  buttons.value[views.findIndex((v) => v.id === view.value)]?.focus();
};
watch(view, () => { hoveredPoint.value = null; }); // a hidden chart keeps no tooltip

// All view: one chart, YLS/YLI/leaves on a 0-12 left axis (taller only when a value needs it), rainfall bars on a right mm axis.
const RR = 34;
const xA = (i) => (weeks.value.length < 2 ? (L + W - RR) / 2 : L + (i * (W - L - RR)) / (weeks.value.length - 1));
const topA = computed(() => axisTop(weeks.value.flatMap((w) => [w.yls, w.yli, w.leaves])));
const yA = (v) => { const t = v / topA.value; return T + (lowerIsWorse.value ? 1 - t : t) * (H - T - B); };
const yRA = (v) => T + (1 - v / rainTop.value) * (H - T - B);
const barWA = computed(() => Math.min(24, ((W - L - RR) / Math.max(weeks.value.length, 1)) * 0.6));
const ptsA = (key) => weeks.value.map((w, i) => (w[key] == null ? null : { x: xA(i), y: yA(w[key]) }));
const ylsA = computed(() => ptsA('yls'));
const yliA = computed(() => ptsA('yli'));
const tri = (p) => `${p.x},${p.y - 4} ${p.x - 3.6},${p.y + 3} ${p.x + 3.6},${p.y + 3}`;
const leavesA = computed(() => weeks.value.map((w, i) => (w.leaves == null ? null : { x: xA(i), y: yA(w.leaves) })));
// Leaves view: same 0-12 scale (taller only when needed), higher is up.
const topL = computed(() => axisTop([...weeks.value.map((w) => w.leaves), props.leaves?.critical, props.leaves?.target]));
const yL = (v) => T + (1 - v / topL.value) * (H - T - B);
const leavesL = computed(() => weeks.value.map((w, i) => (w.leaves == null ? null : { x: x(i), y: yL(w.leaves) })));
const refLines = computed(() => leavesLines(props.leaves));
const lCap = computed(() => leavesCaption(weeks.value));
const sq = (p) => ({ x: p.x - 3, y: p.y - 3 });
const liveText = computed(() => `Showing ${views.find((v) => v.id === view.value).name}`);
const dCap = computed(() => (props.disease ? diseaseCaption({ weeks: weeks.value, disease: props.disease }) : ''));
const rCap = computed(() => (props.rainfall ? rainfallCaption({ rainfall: props.rainfall }) : ''));
const dLabel = computed(() => dCap.value || 'YLS and YLI by week');
const rLabel = computed(() => rCap.value || 'Rainfall by week');
</script>

<template>
  <div>
  <div class="toggle" role="group" aria-label="Trend view" @keydown="onKey">
    <button v-for="(v, i) in views" :key="v.id" :ref="(el) => (buttons[i] = el)" type="button" :class="['tbtn', { on: view === v.id, 'icon-only': v.iconOnly }]"
            :aria-pressed="view === v.id" :aria-label="v.iconOnly ? v.name : undefined" :disabled="!available.includes(v.id)" @click="pick(v.id)">
      <Icon :name="v.icon" :size="18" /><span v-if="!v.iconOnly">{{ v.name }}</span>
    </button>
  </div>
  <p class="sr-only" aria-live="polite">{{ liveText }}</p>

  <figure v-if="view === 'all'">
    <svg :viewBox="`0 0 ${W} ${H}`" role="group" aria-label="YLS, YLI and rainfall by week" @pointerleave="clearChartHover('disease'); clearChartHover('rainfall'); clearChartHover('leaves')">
      <g class="axis">
        <template v-for="t in [0, topA / 2, topA]" :key="t"><line :x1="L" :x2="W - RR" :y1="yA(t)" :y2="yA(t)" /><text :x="L - 6" :y="yA(t) + 3" text-anchor="end">{{ t }}</text></template>
        <template v-if="drawn.rain"><text v-for="t in [0, rainTop / 2, rainTop]" :key="`r${t}`" :x="W - RR + 6" :y="yRA(t) + 3">{{ t }} mm</text></template>
        <text v-for="(w, i) in weeks" :key="w.week" :x="xA(i)" :y="H - 10" text-anchor="middle">{{ label(w.week) }}</text>
      </g>
      <template v-for="(w, i) in weeks" :key="`b${w.week}`">
        <rect v-if="w.rainfall_mm != null" class="bar faint" :x="xA(i) - barWA / 2" :y="yRA(w.rainfall_mm)" :width="barWA" :height="yRA(0) - yRA(w.rainfall_mm)"
              @pointerenter="hoverPoint('rainfall', w, 'Rainfall', w.rainfall_mm, xA(i), yRA(w.rainfall_mm))"
              @pointerleave="clearHover('rainfall', `rainfall-${w.week}-Rainfall`)"><title>{{ w.week }} · Rainfall: {{ w.rainfall_mm }} mm</title></rect>
      </template>
      <path class="yli dashed" :d="linePath(yliA)" />
      <path class="leaves dotted" :d="linePath(leavesA)" />
      <path class="yls" :d="linePath(ylsA)" />
      <template v-for="(w, i) in weeks" :key="w.week">
        <rect v-if="leavesA[i]" v-bind="sq(leavesA[i])" width="6" height="6" class="dot leaves-dot"
              @pointerenter="hoverPoint('leaves', w, 'Leaves', w.leaves, leavesA[i].x, leavesA[i].y)" @pointerleave="clearHover('leaves', `leaves-${w.week}-Leaves`)"><title>{{ w.week }} · Leaves: {{ w.leaves }}</title></rect>
        <circle v-if="ylsA[i]" :cx="ylsA[i].x" :cy="ylsA[i].y" r="3" class="dot yls-dot"
                @pointerenter="hoverPoint('disease', w, 'YLS', w.yls, ylsA[i].x, ylsA[i].y)" @pointerleave="clearHover('disease', `disease-${w.week}-YLS`)"><title>{{ w.week }} · YLS: {{ w.yls }}</title></circle>
        <polygon v-if="yliA[i]" :points="tri(yliA[i])" class="dot yli-dot"
                 @pointerenter="hoverPoint('disease', w, 'YLI', w.yli, yliA[i].x, yliA[i].y)" @pointerleave="clearHover('disease', `disease-${w.week}-YLI`)"><title>{{ w.week }} · YLI: {{ w.yli }}</title></polygon>
      </template>
      <g v-if="activePoint" class="tooltip" aria-hidden="true">
        <rect :x="tooltipX - tooltipWidth / 2" :y="tooltipY - 9" :width="tooltipWidth" height="18" rx="4" />
        <text ref="allTooltipText" :x="tooltipX" :y="tooltipY + 2.5">{{ pointText }}</text>
      </g>
    </svg>
    <p class="key">
      <span v-if="drawn.yls"><svg class="ks" viewBox="0 0 24 10"><line x1="1" x2="23" y1="5" y2="5" class="yls" /><circle cx="12" cy="5" r="3" class="dot" /></svg>YLS</span>
      <span v-if="drawn.yli"><svg class="ks" viewBox="0 0 24 10"><line x1="1" x2="23" y1="5" y2="5" class="yli dashed" /><polygon points="12,1.500 8.400,8.500 15.600,8.500" class="dot yli-dot" /></svg>YLI</span>
      <span v-if="drawn.leaves"><svg class="ks" viewBox="0 0 24 10"><line x1="1" x2="23" y1="5" y2="5" class="leaves dotted" /><rect x="9" y="2" width="6" height="6" class="dot leaves-dot" /></svg>Leaves</span>
      <span v-if="drawn.rain"><i class="sw faintsw"></i>Rainfall (mm, right axis)</span>
    </p>
  </figure>

  <figure v-if="view === 'disease'">
    <figcaption>Leaf-spot stage (YLS) by week <small>— {{ lowerIsWorse ? 'lower = disease on a younger leaf' : 'higher = disease on a younger leaf' }}, so worsening goes down</small></figcaption>
    <svg :viewBox="`0 0 ${W} ${H}`" role="group" :aria-label="dLabel" @pointerleave="clearChartHover('disease')">
      <g class="axis">
        <template v-for="t in ticks" :key="t"><line :x1="L" :x2="W - R" :y1="yD(t)" :y2="yD(t)" /><text :x="L - 6" :y="yD(t) + 3" text-anchor="end">{{ t }}</text></template>
        <text v-for="(w, i) in weeks" :key="w.week" :x="x(i)" :y="H - 10" text-anchor="middle">{{ label(w.week) }}</text>
      </g>
      <path class="yli" :d="linePath(yliPts)" />
      <path class="yls" :d="linePath(ylsPts)" />
      <template v-for="(w, i) in weeks" :key="w.week">
        <circle v-if="ylsPts[i]" :cx="ylsPts[i].x" :cy="ylsPts[i].y" :r="compared.has(w.week) ? 5 : 3" :class="['dot', 'yls-dot', { hi: compared.has(w.week) }]"
                @pointerenter="hoverPoint('disease', w, 'YLS', w.yls, ylsPts[i].x, ylsPts[i].y)"
                @pointerleave="clearHover('disease', `disease-${w.week}-YLS`)">
          <title>{{ w.week }} · YLS: {{ w.yls }}</title>
        </circle>
        <circle v-if="yliPts[i]" :cx="yliPts[i].x" :cy="yliPts[i].y" r="3" class="dot yli-dot"
                @pointerenter="hoverPoint('disease', w, 'YLI', w.yli, yliPts[i].x, yliPts[i].y)"
                @pointerleave="clearHover('disease', `disease-${w.week}-YLI`)">
          <title>{{ w.week }} · YLI: {{ w.yli }}</title>
        </circle>
      </template>
      <g v-if="activePoint?.chart === 'disease'" class="tooltip" aria-hidden="true">
        <rect :x="tooltipX - tooltipWidth / 2" :y="tooltipY - 9" :width="tooltipWidth" height="18" rx="4" />
        <text ref="diseaseTooltipText" :x="tooltipX" :y="tooltipY + 2.5">{{ pointText }}</text>
      </g>
    </svg>
    <p class="sr-only" aria-live="polite">{{ activePoint?.chart === 'disease' ? pointText : '' }}</p>
    <p v-if="dCap" class="cap">{{ dCap }} <span class="soft">YLI (lighter line) is shown for context and is not part of the decision.</span></p>
    <p v-else class="cap soft">YLI (lighter line) is shown for context.</p>
  </figure>

  <figure v-if="view === 'leaves'">
    <figcaption>Functional leaves by week — count 8 weeks after shooting</figcaption>
    <svg :viewBox="`0 0 ${W} ${H}`" role="group" aria-label="Functional leaves by week" @pointerleave="clearChartHover('leaves')">
      <g class="axis">
        <template v-for="t in [0, topL / 2, topL]" :key="t"><line :x1="L" :x2="W - R" :y1="yL(t)" :y2="yL(t)" /><text :x="L - 6" :y="yL(t) + 3" text-anchor="end">{{ t }}</text></template>
        <text v-for="(w, i) in weeks" :key="w.week" :x="x(i)" :y="H - 10" text-anchor="middle">{{ label(w.week) }}</text>
      </g>
      <template v-for="r in refLines" :key="r.kind">
        <line :class="['refline', r.kind]" :x1="L" :x2="W - R" :y1="yL(r.value)" :y2="yL(r.value)" />
      </template>
      <path class="leaves" :d="linePath(leavesL)" />
      <template v-for="(w, i) in weeks" :key="w.week">
        <rect v-if="leavesL[i]" v-bind="sq(leavesL[i])" width="6" height="6" class="dot leaves-dot"
              @pointerenter="hoverPoint('leaves', w, 'Leaves', w.leaves, leavesL[i].x, leavesL[i].y)" @pointerleave="clearHover('leaves', `leaves-${w.week}-Leaves`)"><title>{{ w.week }} · Leaves: {{ w.leaves }}</title></rect>
      </template>
      <g v-if="activePoint?.chart === 'leaves'" class="tooltip" aria-hidden="true">
        <rect :x="tooltipX - tooltipWidth / 2" :y="tooltipY - 9" :width="tooltipWidth" height="18" rx="4" />
        <text ref="leavesTooltipText" :x="tooltipX" :y="tooltipY + 2.5">{{ pointText }}</text>
      </g>
    </svg>
    <p class="key">
      <span v-if="drawn.leaves"><svg class="ks" viewBox="0 0 24 10"><line x1="1" x2="23" y1="5" y2="5" class="leaves" /><rect x="9" y="2" width="6" height="6" class="dot leaves-dot" /></svg>Leaves</span>
      <span v-for="r in refLines" :key="r.kind"><svg class="ks" viewBox="0 0 24 10"><line x1="1" x2="23" y1="5" y2="5" :class="['refline', r.kind]" /></svg>{{ r.label }}</span>
    </p>
    <p class="cap">{{ lCap }}</p>
  </figure>

  <figure v-if="view === 'rain'">
    <figcaption>Rainfall by week (mm)</figcaption>
    <svg :viewBox="`0 0 ${W} ${H}`" role="group" :aria-label="rLabel" @pointerleave="clearChartHover('rainfall')">
      <g class="axis">
        <template v-for="t in [0, rainTop / 2, rainTop]" :key="t"><line :x1="RAIN_L" :x2="W - R" :y1="yR(t)" :y2="yR(t)" /><text :x="L - 6" :y="yR(t) + 3" text-anchor="end">{{ t }}</text></template>
        <text v-for="(w, i) in weeks" :key="w.week" :x="rainX(i)" :y="H - 10" text-anchor="middle">{{ label(w.week) }}</text>
      </g>
      <template v-for="(w, i) in weeks" :key="w.week">
        <rect v-if="w.rainfall_mm != null" :class="['bar', group(w.week)]" :x="rainX(i) - barW / 2" :y="yR(w.rainfall_mm)" :width="barW" :height="yR(0) - yR(w.rainfall_mm)"
              @pointerenter="hoverPoint('rainfall', w, 'Rainfall', w.rainfall_mm, rainX(i), yR(w.rainfall_mm))"
              @pointerleave="clearHover('rainfall', `rainfall-${w.week}-Rainfall`)">
          <title>{{ w.week }} · Rainfall: {{ w.rainfall_mm }} mm</title>
        </rect>
      </template>
      <line v-if="minLine" class="min" :x1="RAIN_L" :x2="W - R" :y1="yR(minLine)" :y2="yR(minLine)" />
      <g v-if="activePoint?.chart === 'rainfall'" class="tooltip" aria-hidden="true">
        <rect :x="tooltipX - tooltipWidth / 2" :y="tooltipY - 9" :width="tooltipWidth" height="18" rx="4" />
        <text ref="rainfallTooltipText" :x="tooltipX" :y="tooltipY + 2.5">{{ pointText }}</text>
      </g>
    </svg>
    <p class="sr-only" aria-live="polite">{{ activePoint?.chart === 'rainfall' ? pointText : '' }}</p>
    <p v-if="rainfall" class="legend"><i class="sw recent"></i>Last {{ rainfall.window_weeks }} weeks <i class="sw previous"></i>Weeks before <span v-if="minLine"><i class="sw minsw"></i>Minimum per week</span></p>
    <p v-if="rCap" class="cap">{{ rCap }}</p>
  </figure>

  </div>
</template>

<style scoped>
figure { margin: 12px 0 0; }
figcaption { font-weight: 600; font-size: .9rem; }
figcaption small { font-weight: 400; color: var(--ink-soft); }
svg { width: 100%; height: auto; display: block; margin-top: 6px; }
.axis line { stroke: var(--line); }
.axis text { fill: var(--ink-soft); font-size: 9px; }
path { fill: none; stroke-linejoin: round; stroke-linecap: round; }
.yls { stroke: var(--forest); stroke-width: 2.5; }
.yli { stroke: var(--leaf-soft); stroke-width: 2; }
/* no vertex shapes: a dot is an invisible, wider hover target; only a compared week (hi) is drawn */
.dot { fill: transparent; stroke: transparent; stroke-width: 10; cursor: crosshair; }
.dot.hi { fill: var(--warn); stroke: var(--card); stroke-width: 1.5; }
.bar.recent { fill: var(--teal); }
.bar.previous { fill: var(--leaf-soft); }
.bar.other { fill: var(--line); }
.bar { cursor: crosshair; }
.tooltip rect { fill: var(--ink); }
.tooltip text { fill: #fff; font-size: 7px; text-anchor: middle; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.min { stroke: var(--danger); stroke-dasharray: 4 3; }
.cap { margin: 6px 0 0; font-size: .9rem; }
.soft { color: var(--ink-soft); }
.legend { font-size: .8rem; color: var(--ink-soft); margin: 4px 0 0; }
.sw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin: 0 4px 0 8px; vertical-align: baseline; }
.sw:first-child { margin-left: 0; }
.sw.recent { background: var(--teal); }
.sw.previous { background: var(--leaf-soft); }
.sw.minsw { background: var(--danger); }
@media (forced-colors: active) { .tbtn.on { outline: 2px solid; } }
.toggle { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.tbtn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; min-height: 44px; min-width: 44px; padding: 0 14px; border: 1.5px solid #9aa3a0; border-radius: 999px; background: #fff; color: var(--ink); font: 700 14px inherit; font-family: inherit; cursor: pointer; }
.tbtn.icon-only { padding: 0; width: 44px; }
.tbtn.on { background: var(--forest); color: #fff; border-color: var(--forest); }
/* the chart rule `svg { width: 100%; margin-top }` also hits the icons (a child root takes the parent's scope) */
.tbtn svg { width: 20px; height: 20px; margin: 0; }
.tbtn:disabled { opacity: .45; cursor: not-allowed; }
.tbtn:focus-visible { outline: 3px solid #1b6fd6; outline-offset: 2px; }
.leaves { stroke: #8a6d1f; stroke-width: 2.5; }
.dotted { stroke-dasharray: 1 4; }
.refline { stroke-width: 1.5; }
.refline.critical { stroke: var(--danger); stroke-dasharray: 4 3; }
.refline.target { stroke: var(--forest); stroke-dasharray: 1.5 3; }
.dashed { stroke-dasharray: 5 3; }
.bar.faint { fill: var(--teal); opacity: .25; }
.faintsw { background: var(--teal); opacity: .25; }
.key { display: flex; flex-wrap: wrap; gap: 4px 14px; font-size: .8rem; color: var(--ink-soft); margin: 4px 0 0; }
.key span { display: inline-flex; align-items: center; gap: 4px; }
.ks { width: 24px; height: 10px; margin: 0; display: inline-block; }
.ks line { stroke-width: 2; }
</style>
