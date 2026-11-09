<script setup>
import { computed, ref, onMounted, onBeforeUnmount } from 'vue';
import { diseaseCaption, rainfallCaption, missingWeeks, linePath, niceMax } from '../helpers/evidence.js';

// Weekly YLS/YLI and rainfall as plain SVG. With `disease` and `rainfall` (a cycle's evidence) the compared
// weeks are highlighted and captioned; without them it is a plain look at recent weeks.
const props = defineProps({ weeks: { type: Array, required: true }, disease: { type: Object, default: null }, rainfall: { type: Object, default: null } });

// The weeks list (this line was missing and made the charts disappear).
const weeks = computed(() => props.weeks);

// The SVG is drawn at the real width of its container (1 unit = 1 px), so text stays 12px
// on a wide page. 760 is the safe default until the width is measured; it is never 0.
const container = ref(null);
const W = ref(760);
const H_LINE = 220, H_BAR = 200;
const L = 40, R = 20, T = 12, B = 28;

let ro = null;
function measure() {
  const w = container.value?.clientWidth;
  if (w && w >= 240) W.value = Math.round(w);
}
onMounted(() => {
  measure();
  if (typeof ResizeObserver !== 'undefined' && container.value) {
    ro = new ResizeObserver(measure);
    ro.observe(container.value);
  }
});
onBeforeUnmount(() => { if (ro) ro.disconnect(); clearTimeout(touchTimer); });

const label = (w) => `W${w.slice(-2)}`;
// Both charts place each week at the centre of its own band, so W20..W23 line up and bars never clip.
const bandW = computed(() => (W.value - L - R) / Math.max(weeks.value.length, 1));
const x = (i) => L + (i + 0.5) * bandW.value;

// Disease chart: the axis runs so that the worsening direction is always down.
const lowerIsWorse = computed(() => props.disease?.worsening_direction !== 'higher');
const diseaseValues = computed(() => weeks.value.flatMap((w) => [w.yls, w.yli]).filter((v) => v != null));
const lo = computed(() => Math.min(...diseaseValues.value, 0));
const hi = computed(() => Math.max(...diseaseValues.value, 1));
const yD = (v) => {
  const t = (v - lo.value) / (hi.value - lo.value || 1);
  return T + (lowerIsWorse.value ? 1 - t : t) * (H_LINE - T - B);
};
const series = (key) => weeks.value.map((w, i) => (w[key] == null ? null : { x: x(i), y: yD(w[key]) }));
const ylsPts = computed(() => series('yls'));
const yliPts = computed(() => series('yli'));
const compared = computed(() => new Set(props.disease?.compared_weeks ?? []));
const ticks = computed(() => [lo.value, Math.round((lo.value + hi.value) / 2), hi.value]);

// Rainfall chart.
const rainTop = computed(() => niceMax(Math.max(0, ...weeks.value.map((w) => w.rainfall_mm ?? 0), props.rainfall?.min_total_mm ?? 0)));
const yR = (v) => T + (1 - v / rainTop.value) * (H_BAR - T - B);
const barW = computed(() => Math.min(40, Math.max(24, bandW.value * 0.4)));
const group = (w) => (!props.rainfall || props.rainfall.recent_weeks.includes(w) ? 'recent' : props.rainfall.previous_weeks.includes(w) ? 'previous' : 'other');
const minLine = computed(() => (props.rainfall?.min_total_mm > 0 ? props.rainfall.min_total_mm / Math.max(props.rainfall.window_weeks, 1) : 0));
// Bar with rounded TOP corners only.
const barPath = (i, mm) => {
  const w = barW.value, r = Math.min(4, w / 2);
  const x0 = x(i) - w / 2, y0 = yR(mm), y1 = yR(0);
  const h = Math.max(y1 - y0, 0);
  if (h < r) return `M${x0},${y1}h${w}v${-h}h${-w}z`;
  return `M${x0},${y1}V${y0 + r}q0,${-r} ${r},${-r}h${w - 2 * r}q${r},0 ${r},${r}V${y1}z`;
};

const missing = computed(() => missingWeeks(weeks.value));
const missingText = computed(() => {
  const parts = [['YLS', 'yls'], ['YLI', 'yli'], ['Rainfall', 'rainfall_mm']].filter(([, k]) => missing.value[k].length).map(([n, k]) => `${n}: ${missing.value[k].join(', ')}`);
  return parts.length ? `Missing weeks — ${parts.join('; ')}.` : '';
});
const dCap = computed(() => (props.disease ? diseaseCaption({ weeks: weeks.value, disease: props.disease }) : ''));
const rCap = computed(() => (props.rainfall ? rainfallCaption({ rainfall: props.rainfall }) : ''));
const dLabel = computed(() => dCap.value || 'YLS and YLI by week');
const rLabel = computed(() => rCap.value || 'Rainfall by week');
const cell = (v) => (v == null ? '—' : v);

// ---- Tooltip (hover, keyboard focus, or tap-and-hold ~400ms on touch) ----
const tip = ref(null);
const hoveredDot = ref(null);
let touchTimer = null;
let touchShown = false;

function prevYls(i) {
  return i > 0 ? weeks.value[i - 1].yls : null;
}
function lineTip(i) {
  const w = weeks.value[i];
  const prev = prevYls(i);
  let change = '';
  if (w.yls != null && prev != null) change = w.yls < prev ? `down from ${prev}` : w.yls > prev ? `up from ${prev}` : `same as ${prev}`;
  return { title: label(w.week), rows: [`YLS: ${cell(w.yls)}`, `YLI: ${cell(w.yli)}`], note: change ? `YLS ${change}` : '' };
}
function barTip(i) {
  const w = weeks.value[i];
  return { title: label(w.week), rows: [`Rainfall: ${cell(w.rainfall_mm)} mm`], note: '' };
}
function showTip(el, content) {
  const r = el.getBoundingClientRect();
  const vw = window.innerWidth;
  const below = r.top < 100; // flip under the point near the top of the screen
  tip.value = { x: Math.min(Math.max(r.left + r.width / 2, 100), vw - 100), y: below ? r.bottom : r.top, below, ...content };
}
function hideTip() {
  tip.value = null;
  hoveredDot.value = null;
}
function enter(e, content, i = null) {
  hoveredDot.value = i;
  showTip(e.currentTarget, content);
}
function touchStart(e, content, i = null) {
  const el = e.currentTarget;
  touchShown = false;
  hoveredDot.value = i;
  clearTimeout(touchTimer);
  touchTimer = setTimeout(() => { showTip(el, content); touchShown = true; }, 400);
}
function touchEnd() {
  clearTimeout(touchTimer);
  hideTip();
  touchShown = false;
}
</script>

<template>
  <div ref="container" class="charts">
    <figure>
      <figcaption>Leaf-spot stage (YLS) by week <small>— {{ lowerIsWorse ? 'lower = disease on a younger leaf' : 'higher = disease on a younger leaf' }}, so worsening goes down</small></figcaption>
      <svg :viewBox="`0 0 ${W} ${H_LINE}`" :style="{ height: H_LINE + 'px' }" role="img" :aria-label="dLabel" @keydown.esc="hideTip" @contextmenu.prevent>
        <g class="axis">
          <template v-for="t in ticks" :key="t"><line :x1="L" :x2="W - R" :y1="yD(t)" :y2="yD(t)" /><text :x="L - 8" :y="yD(t) + 4" text-anchor="end">{{ t }}</text></template>
          <text v-for="(w, i) in weeks" :key="w.week" :x="x(i)" :y="H_LINE - 8" text-anchor="middle">{{ label(w.week) }}</text>
        </g>
        <path class="yli" :d="linePath(yliPts)" />
        <path class="yls" :d="linePath(ylsPts)" />
        <template v-for="(p, i) in ylsPts" :key="weeks[i].week">
          <circle v-if="p" :cx="p.x" :cy="p.y" :r="hoveredDot === i ? 7 : 5" :class="['dot', { hi: compared.has(weeks[i].week) }]" tabindex="0"
            :aria-label="`${label(weeks[i].week)}: YLS ${cell(weeks[i].yls)}, YLI ${cell(weeks[i].yli)}`"
            @mouseenter="enter($event, lineTip(i), i)" @mouseleave="hideTip"
            @focus="enter($event, lineTip(i), i)" @blur="hideTip"
            @touchstart.passive="touchStart($event, lineTip(i), i)" @touchend="touchEnd" @touchcancel="touchEnd" />
        </template>
      </svg>
      <p v-if="dCap" class="cap">{{ dCap }} <span class="soft">YLI (lighter line) is shown for context and is not part of the decision.</span></p>
      <p v-else class="cap soft">YLI (lighter line) is shown for context.</p>
    </figure>

    <figure>
      <figcaption>Rainfall by week (mm)</figcaption>
      <svg :viewBox="`0 0 ${W} ${H_BAR}`" :style="{ height: H_BAR + 'px' }" role="img" :aria-label="rLabel" @keydown.esc="hideTip" @contextmenu.prevent>
        <g class="axis">
          <template v-for="t in [0, rainTop / 2, rainTop]" :key="t"><line :x1="L" :x2="W - R" :y1="yR(t)" :y2="yR(t)" /><text :x="L - 8" :y="yR(t) + 4" text-anchor="end">{{ t }}</text></template>
          <text v-for="(w, i) in weeks" :key="w.week" :x="x(i)" :y="H_BAR - 8" text-anchor="middle">{{ label(w.week) }}</text>
        </g>
        <template v-for="(w, i) in weeks" :key="w.week">
          <path v-if="w.rainfall_mm != null" :class="['bar', group(w.week)]" :d="barPath(i, w.rainfall_mm)" tabindex="0"
            :aria-label="`${label(w.week)}: ${w.rainfall_mm} mm`"
            @mouseenter="enter($event, barTip(i))" @mouseleave="hideTip"
            @focus="enter($event, barTip(i))" @blur="hideTip"
            @touchstart.passive="touchStart($event, barTip(i))" @touchend="touchEnd" @touchcancel="touchEnd" />
        </template>
        <line v-if="minLine" class="min" :x1="L" :x2="W - R" :y1="yR(minLine)" :y2="yR(minLine)" />
      </svg>
      <p v-if="rainfall" class="legend"><i class="sw recent"></i>Last {{ rainfall.window_weeks }} weeks <i class="sw previous"></i>Weeks before <span v-if="minLine"><i class="sw minsw"></i>Minimum per week</span></p>
      <p v-if="rCap" class="cap">{{ rCap }}</p>
    </figure>

    <p v-if="missingText" class="cap soft">{{ missingText }}</p>
    <details>
      <summary>Show the numbers</summary>
      <table>
        <thead><tr><th>Week</th><th>YLS</th><th>YLI</th><th>Rain (mm)</th></tr></thead>
        <tbody><tr v-for="w in weeks" :key="w.week"><td>{{ w.week }}</td><td>{{ cell(w.yls) }}</td><td>{{ cell(w.yli) }}</td><td>{{ cell(w.rainfall_mm) }}</td></tr></tbody>
      </table>
    </details>

    <div v-if="tip" class="tooltip" :class="{ below: tip.below }" :style="{ left: tip.x + 'px', top: tip.y + 'px' }" role="tooltip">
      <div class="tooltip__body">
        <div class="t-title">{{ tip.title }}</div>
        <div v-for="r in tip.rows" :key="r">{{ r }}</div>
        <div v-if="tip.note" class="t-note">{{ tip.note }}</div>
      </div>
    </div>
  </div>
</template>

<style scoped>
figure { margin: 12px 0 0; }
figcaption { font-weight: 600; font-size: .9rem; }
figcaption small { font-weight: 400; color: var(--ink-soft); }
svg { width: 100%; display: block; margin-top: 6px; overflow: visible; }
.axis line { stroke: #E5E7EB; stroke-width: 1px; }
.axis text { fill: #6B7280; font-size: 12px; }
path { fill: none; stroke-linejoin: round; stroke-linecap: round; }
.yls { stroke: var(--forest); stroke-width: 2.5; }
.yli { stroke: var(--leaf-soft); stroke-width: 2; }
.dot { fill: var(--forest); cursor: pointer; transition: r .12s; }
.dot:focus { outline: none; stroke: var(--leaf); stroke-width: 3; }
.dot.hi { fill: var(--warn); stroke: var(--card); stroke-width: 1.5; }
.bar { cursor: pointer; stroke: none; }
.bar.recent { fill: var(--teal); }
.bar.previous { fill: var(--leaf-soft); }
.bar.other { fill: var(--line); }
.bar:hover, .bar:focus { opacity: .85; outline: none; }
.min { stroke: var(--danger); stroke-dasharray: 4 3; }
.cap { margin: 6px 0 0; font-size: .9rem; }
.soft { color: var(--ink-soft); }
.legend { font-size: .8rem; color: var(--ink-soft); margin: 4px 0 0; }
.sw { display: inline-block; width: 10px; height: 10px; border-radius: 2px; margin: 0 4px 0 8px; vertical-align: baseline; }
.sw:first-child { margin-left: 0; }
.sw.recent { background: var(--teal); }
.sw.previous { background: var(--leaf-soft); }
.sw.minsw { background: var(--danger); }
details { margin-top: 10px; font-size: .85rem; }
table { border-collapse: collapse; margin-top: 6px; }
th, td { padding: 3px 12px 3px 0; text-align: left; }

.tooltip { position: fixed; z-index: 60; pointer-events: none; transform: translate(-50%, calc(-100% - 10px)); }
.tooltip.below { transform: translate(-50%, 10px); }
.tooltip__body { min-width: 120px; max-width: 180px; padding: 8px 10px; border: 1px solid #E5E7EB; border-radius: 10px; background: #fff; color: #1F2937; font: 400 12px var(--font-body); line-height: 1.4; box-shadow: 0 6px 20px rgba(0, 0, 0, .1); }
.t-title { font-weight: 600; margin-bottom: 2px; }
.t-note { margin-top: 4px; color: #6B7280; font-size: 11px; }
</style>