<script setup>
import { computed, ref, watch } from 'vue';
import { scheduleEvents, monthGrids, isoWeek } from '../helpers/schedule.js';
import { todayIso, fromIso, toIso } from '../helpers/today.js';
import Icon from './Icon.vue';
import CalendarBadge from './CalendarBadge.vue';
import MissedFlame from './MissedFlame.vue';

// Add one calendar day to an ISO date (YYYY-MM-DD).
function addOneDay(iso) {
  const d = fromIso(iso);
  d.setDate(d.getDate() + 1);
  return toIso(d);
}

// TEMPORARY: demo missed dates for testing — delete this line (and the forEach below) after testing.
const DEMO_MISSED = ['2026-06-01'];

const props = defineProps({ days: { type: Array, default: () => [] }, applications: { type: Array, default: () => [] }, nameOf: { type: Function, default: (id) => id }, assessedWeeks: { type: Array, default: () => [] } });
const events = computed(() => scheduleEvents(props.days, props.applications, props.nameOf, props.assessedWeeks));
const months = computed(() => monthGrids(events.value));
// The month shown opens on today's month when the schedule has it, else the first.
const at = ref(0);
watch(months, (ms) => { const i = ms.findIndex((m) => todayIso().startsWith(m.key)); at.value = Math.max(i, 0); }, { immediate: true });
const m = computed(() => months.value[at.value]);
const todayIsoVal = computed(() => todayIso());

// DD/MM/YYYY for a single date; "DD/MM/YYYY – DD/MM/YYYY" for a range.
const short = (iso) => `${iso.slice(8, 10)}/${iso.slice(5, 7)}/${iso.slice(0, 4)}`;
const range = (e) => (e.kind === 'application' ? `${short(e.start)} – ${short(e.end)}` : short(e.date));

const todayDay = computed(() => (m.value && todayIsoVal.value.startsWith(m.value.key) ? Number(todayIsoVal.value.slice(8)) : null));
const count = computed(() => `${events.value.filter((e) => e.kind === 'applied').length} recorded · ${events.value.filter((e) => e.kind === 'application').length} suggested`);

// ISO date for a calendar cell day number, using the current month key.
const dayIso = (c) => `${m.value.key}-${String(c).padStart(2, '0')}`;

// 'recorded' when done, 'missed' when past due and not done, 'event' otherwise.
// For applications (spray windows) the due date is the window end; for monitoring it's the day itself.
const badgeKind = (e) => {
  if (e.done) return 'recorded';
  if (missedDates.value.has(e.kind === 'application' ? e.end : e.date)) return 'missed';
  return 'event';
};
const badgeIcon = (e) => (e.kind === 'application' ? 'drop' : 'search');

// Cell outline colour: orange for a spray window, green for a scan/re-assess.
const cellCls = (day) => {
  if (day.some((e) => e.kind === 'applied')) return 'rec';
  if (day.some((e) => e.kind === 'application')) return 'sug';
  return 'plum';
};

// Missed dates: scans whose week is not assessed and whose date is before today;
// spray windows whose end date has passed with no recorded application inside the window.
// Test with the DEV date bar:
//   DEV 2026-06-08  → none missed (only the demo date, June 1)
//   DEV 2026-06-12  → June 8 missed (weekly scan, W24 not assessed); June 10-16 still open, not missed
//   DEV 2026-06-17  → June 10-16 spray window and June 15 scan missed (nothing recorded)
const missedDates = computed(() => {
  const missed = new Set();
  const today = todayIsoVal.value;
  for (const e of events.value) {
    if (e.done) continue;
    if (e.kind === 'application') {
      if (e.end && e.end < today) {
        let d = e.start;
        while (d <= e.end) {
          missed.add(d);
          d = addOneDay(d);
        }
      }
    } else if (e.date < today) {
      if (!props.assessedWeeks.includes(isoWeek(e.date))) {
        missed.add(e.date);
      }
    }
  }
  // TEMPORARY demo dates — remove with DEMO_MISSED after testing
  DEMO_MISSED.forEach((d) => missed.add(d));
  return missed;
});

// True when at least one date is missed (used for the conditional legend item).
const hasMissed = computed(() => missedDates.value.size > 0);
</script>

<template>
  <p v-if="!m" class="empty">No application or assessment days are scheduled.</p>
  <template v-else>
    <section class="prop-card cal">
      <header>
        <button type="button" :disabled="at === 0" aria-label="Previous month" @click="at--">‹</button>
        <h3>{{ m.month }} {{ m.year }}</h3>
        <button type="button" :disabled="at === months.length - 1" aria-label="Next month" @click="at++">›</button>
      </header>
      <ul class="weekdays">
        <li v-for="(w, wi) in ['M', 'T', 'W', 'T', 'F', 'S', 'S']" :key="wi">{{ w }}</li>
      </ul>
      <div class="grid">
        <template v-for="(c, i) in m.cells" :key="i">
          <span v-if="!c" />
          <span
            v-else-if="m.onDay[c]"
            :class="['cell', 'has-events', cellCls(m.onDay[c]), { today: c === todayDay, missed: missedDates.has(dayIso(c)) }]"
          >
            <span class="date-number">{{ c }}</span>
            <div class="badges">
              <CalendarBadge
                v-for="(e, bi) in m.onDay[c]"
                :key="bi"
                :kind="badgeKind(e)"
                :icon="badgeIcon(e)"
              />
            </div>
          </span>
          <!-- A missed date with no event of its own still shows the flame -->
          <span v-else-if="missedDates.has(dayIso(c))" :class="['cell', 'has-events', 'missed', { today: c === todayDay }]">
            <span class="date-number">{{ c }}</span>
            <div class="badges"><CalendarBadge kind="missed" /></div>
          </span>
          <span v-else :class="['cell', { today: c === todayDay }]">{{ c }}</span>
        </template>
      </div>
      <ul class="legend" aria-label="Legend">
        <li><span class="swatch sug" aria-hidden="true"></span>Spray window</li>
        <li><span class="swatch plum" aria-hidden="true"></span>Scan / re-assess</li>
        <li><span class="swatch today" aria-hidden="true"></span>Today</li>
        <li v-if="hasMissed"><MissedFlame :size="14" label="Missed" />Missed</li>
      </ul>
    </section>
    <section class="prop-card tl">
      <header><h3>Timeline</h3><span class="count">{{ count }}</span></header>
      <ol>
        <li v-for="e in events" :key="e.date + e.kind + e.label" :class="[e.kind, { done: e.done, missed: badgeKind(e) === 'missed' }]">
          <span class="node" v-if="badgeKind(e) === 'missed'">
            <MissedFlame :size="18" label="Missed" />
          </span>
          <span class="node" v-else-if="e.done">
            <Icon name="check" :size="10" />
          </span>
          <span class="node" v-else :class="e.kind"></span>
          <div class="date">{{ range(e) }}</div>
          <div class="card">
            <h5>{{ e.label }}<small v-if="e.moa"> · {{ e.moa }}</small></h5>
            <p v-if="e.kind === 'applied'">Applied on {{ e.date }}.</p>
            <p v-else-if="e.kind === 'application'">Apply between {{ e.start }} and {{ e.end }}.<template v-if="e.done"> Applied.</template></p>
            <p v-else>Scan this line again on {{ e.date }}.<template v-if="e.after"> Follows {{ e.after }}.</template></p>
          </div>
        </li>
      </ol>
    </section>
  </template>
</template>

<style scoped>
.empty { padding: 30px; text-align: center; color: var(--ink-soft); border: 1.5px dashed var(--line); border-radius: var(--radius-md); background: var(--card); }
.prop-card { box-sizing: border-box; width: 100%; min-width: 0; padding: 18px; margin-bottom: 18px; border-radius: 20px; background: var(--card); box-shadow: var(--shadow); }
.prop-card h3 { font: 600 18px var(--font-display); color: #15803D; margin-bottom: 8px; }
.cal header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; } .cal header h3 { margin: 0; }
.cal header button { flex-shrink: 0; width: 36px; height: 36px; border: 1px solid #16A34A; border-radius: 10px; background: none; font-size: 18px; color: #16A34A; } .cal header button:disabled { opacity: .35; border-color: rgba(22, 163, 74, .3); color: rgba(22, 163, 74, .3); }

/* Weekday row and grid share the same padding + gap so columns always line up.
   minmax(0, 1fr) lets columns shrink below their content, so 7 columns never overflow. */
.weekdays, .grid { display: grid; grid-template-columns: repeat(7, minmax(0, 1fr)); padding: 0 6px; }
.weekdays { margin: 0 0 8px; list-style: none; font: 500 11px var(--font-body); color: #6B7280; text-transform: uppercase; letter-spacing: .04em; } .weekdays li { text-align: center; }
.grid { gap: 6px; }

/* Cell scales with its column (up to 46px) and stays a circle via aspect-ratio. */
.cell { position: relative; box-sizing: border-box; display: grid; place-items: center; width: 100%; max-width: 46px; height: auto; aspect-ratio: 1 / 1; border-radius: 50%; font-size: 14px; color: #1F2937; justify-self: center; }
.cell .date-number { color: #1F2937; }
.cell.has-events { border: 2px solid; background: none; }
.cell.has-events.sug { border-color: #F59E0B; background: #FFFBEB; }
.cell.has-events.plum { border-color: #16A34A; background: #ECFDF3; }
.cell.has-events.rec { border: none; background: #16A34A; color: #fff; }
.cell.has-events.rec .date-number { color: #fff; }
.cell.has-events.missed { border-color: #EF4444; background: #FEF2F2; }
.cell.has-events.missed .date-number { color: #1F2937; }
/* Today wins over every other style — solid green, white number, always visible */
.cell.today { background: #16A34A; color: #fff; border-color: #16A34A; }
.cell.today .date-number { color: #fff; font-weight: 600; }
.cell.has-events.today { background: #16A34A; color: #fff; border-color: #16A34A; }
.cell.has-events.today .date-number { color: #fff; font-weight: 600; }
.badges { position: absolute; top: -4px; right: -4px; display: flex; gap: 4px; }

.legend { display: flex; flex-wrap: wrap; gap: 6px 16px; margin: 10px 0 0; padding: 0; list-style: none; font-size: 12px; color: #6B7280; }
.legend li { display: flex; align-items: center; gap: 6px; }
.swatch { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.swatch.sug { border: 2px solid #F59E0B; background: #fff; }
.swatch.plum { border: 2px solid #16A34A; background: #fff; }
.swatch.today { background: #16A34A; }

.tl header { display: flex; justify-content: space-between; align-items: center; gap: 8px; } .count { font-size: 12px; color: #6B7280; font-weight: 500; }
.tl { padding: 22px 24px; }
.tl ol { list-style: none; margin: 8px 0 0; padding: 0; display: grid; gap: 10px; }
.tl li { display: grid; grid-template-columns: 24px 190px minmax(0, 1fr); gap: 16px; align-items: start; padding-bottom: 10px; border-bottom: 1px solid #F1F5F2; }
.tl li:last-child { border-bottom: none; padding-bottom: 0; }
.tl .card { min-width: 0; overflow-wrap: anywhere; }
.date { white-space: nowrap; font-variant-numeric: tabular-nums; font: 500 13.5px var(--font-body); color: #15803D; }
.node { display: flex; align-items: center; justify-content: center; width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; }
.node.sug { border: 2px solid #D98A00; }
.node.plum { border: 2px solid #16A34A; }
.node.rec { background: #16A34A; color: #fff; }
.node.rec .icon { width: 10px; height: 10px; flex: none; }
.missed .node { border: none; background: none; }
.card h5 { font: 600 15px var(--font-display); color: #1F2937; margin: 0 0 2px; }
.card h5 small { font-weight: 400; font-size: 13px; color: #6B7280; }
.card p { margin-top: 2px; font-size: 13px; color: #6B7280; font-weight: 400; }

/* Tablet / narrow: stack timeline date above the card */
@media (max-width: 599px) {
  .tl { padding: 16px; }
  .tl li { grid-template-columns: 24px minmax(0, 1fr); gap: 4px 8px; }
  .tl li .node { grid-column: 1; grid-row: 1; align-self: start; }
  .tl li .date { grid-column: 2; grid-row: 1; white-space: normal; }
  .tl li .card { grid-column: 2; grid-row: 2; }
}

/* Phones */
@media (max-width: 420px) {
  .prop-card { padding: 14px; border-radius: 16px; }
  .prop-card h3 { font-size: 16px; }
  .cal header button { width: 32px; height: 32px; }
  .weekdays, .grid { padding: 0 4px; } /* room for badges on the edge columns */
  .grid { gap: 4px; }
  .weekdays { font-size: 10px; }
  .cell { font-size: 12px; }
  .cell.has-events { border-width: 1.5px; }
  /* Shrink the badges so several fit on a small cell */
  .badges { top: -5px; right: -5px; gap: 2px; transform: scale(.7); transform-origin: top right; }
  .legend { gap: 6px 12px; font-size: 11px; }
  .tl { padding: 14px; }
}

/* Very small phones (≤ 340px) */
@media (max-width: 340px) {
  .grid { gap: 3px; }
  .cell { font-size: 11px; }
}
</style>