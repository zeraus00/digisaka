<script setup>
import { computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useLinesStore, dashboardSummary } from '../stores/lines.js';
import { today } from '../helpers/today.js';
import Icon from '../components/Icon.vue';

const router = useRouter(), auth = useAuthStore(), lines = useLinesStore();
const name = computed(() => { const w = auth.email.split('@')[0].split(/[._-]/)[0]; return w ? w[0].toUpperCase() + w.slice(1) : ''; });
// Good morning / afternoon / evening, based on the time of day.
const greeting = computed(() => {
  const h = new Date().getHours();
  const part = h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
  return `Good ${part}${name.value ? ', ' + name.value : ''}!`;
});
const date = computed(() => today().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' }));
const sum = computed(() => dashboardSummary(lines.statuses));

onMounted(() => lines.load());
const open = (r) => router.push(`/treatment/${encodeURIComponent(r.lineId)}/${encodeURIComponent(r.week)}`);
</script>

<template>
  <div class="page">
    <div class="dash-grid">
      <!-- Row 1: greeting | smart schedule -->
      <section class="card greet">
        <div class="avatar" aria-hidden="true">{{ auth.initials }}</div>
        <div class="greet-copy">
          <h1>{{ greeting }}</h1>
          <p class="date">{{ date }}</p>
        </div>
      </section>

      <button class="card schedule" type="button" @click="router.push('/schedule')">
        <span class="tile yellow"><Icon name="calendar" /></span>
        <span class="txt"><b>Smart Schedule</b><small>Plan and track treatment</small></span>
        <i>›</i>
      </button>

      <!-- Row 2: the two green rectangles -->
      <button class="big" type="button" @click="router.push('/scan')">
        <Icon name="scan" :size="34" />
        <b>Disease Detection</b>
        <small>Scan banana leaves for Black Sigatoka</small>
      </button>
      <button class="big" type="button" @click="router.push('/history')">
        <Icon name="history" :size="34" />
        <b>Diagnosis History</b>
        <small>Review each line's weeks and suggestions</small>
      </button>

      <!-- Row 3: farm overview (left) | recent results (right) -->
      <section class="col">
        <div class="section-head"><h2>Farm Overview</h2><a href="#" @click.prevent="router.push('/history')">View history →</a></div>
        <p v-if="lines.error" class="error">{{ lines.error }}</p>
        <div class="stats">
          <div class="stat"><span class="chip blue"><Icon name="plus" :size="18" /></span><b>{{ sum.leavesScanned }}</b><small>Leaves Scanned</small></div>
          <div class="stat"><span class="chip purple"><Icon name="history" :size="18" /></span><b>{{ sum.weeksAssessed }}</b><small>Line-weeks Assessed</small></div>
          <div class="stat"><span class="chip orange"><Icon name="alert" :size="18" /></span><b>{{ sum.applications }}</b><small>Applications Recorded</small></div>
        </div>
        <p class="note">Counts cover finished weeks across {{ sum.lines }} {{ sum.lines === 1 ? 'line' : 'lines' }}.<template v-if="sum.humanReview"> {{ sum.humanReview }} {{ sum.humanReview === 1 ? 'line needs' : 'lines need' }} human review.</template></p>
      </section>

      <section class="col">
        <div class="section-head"><h2>Recent results</h2></div>
        <div v-if="lines.loaded && !sum.recent.length" class="empty">
          No results yet. Scan a line to see one here.
          <button type="button" @click="router.push('/scan')">Start a scan</button>
        </div>
        <button v-for="r in sum.recent" :key="r.lineId + r.week" class="recent" type="button" @click="open(r)">
          <span class="grow"><b>Line {{ r.lineId }}</b><small>{{ r.week }}</small></span>
          <span class="badge" :class="r.outcome === 'suggested' ? 'ok' : 'warn'">{{ r.label }}</span>
        </button>
      </section>
    </div>
  </div>
</template>

<style scoped>
/* One shared 2-column grid: every row has a left and a right block of exactly the same width. */
.dash-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; align-items: stretch; }
.col { align-self: start; min-width: 0; }

/* Row 1 */
.card { display: flex; align-items: center; gap: 14px; min-height: 110px; padding: 18px 20px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--card); box-shadow: var(--shadow); min-width: 0; }
.greet .avatar { display: grid; place-items: center; flex: none; width: 64px; height: 64px; border-radius: 50%; background: var(--forest); color: #fff; font: 800 22px var(--font-display); }
.greet-copy { flex: 1; min-width: 0; }
.greet h1 { margin: 0; font: 800 24px/1.2 var(--font-display); color: var(--ink); overflow-wrap: anywhere; }
.date { margin-top: 4px; font-size: 13px; font-weight: 700; color: var(--ink-soft); }
.schedule { width: 100%; text-align: left; transition: border-color .15s, transform .15s; }
.schedule:hover { border-color: var(--leaf); transform: translateY(-1px); }
.tile { display: grid; place-items: center; flex: none; width: 48px; height: 48px; border-radius: 14px; color: #fff; font-size: 20px; }
.tile.yellow { background: var(--banana); }
.txt { flex: 1; min-width: 0; display: grid; gap: 2px; }
.txt b { font: 800 18px var(--font-display); color: var(--forest); }
.txt small { color: var(--ink-soft); font-weight: 700; font-size: 14px; line-height: 1.35; }
.schedule i { flex: none; font-style: normal; font-size: 22px; color: var(--ink-soft); }

/* Row 2 */
.big { display: grid; justify-items: center; align-content: center; gap: 6px; min-width: 0; min-height: 150px; padding: 20px; border: 0; border-radius: var(--radius-md); background: var(--forest); color: #fff; text-align: center; box-shadow: var(--shadow); transition: transform .15s, filter .15s; }
.big:hover { transform: translateY(-1px); filter: brightness(1.08); }
.big b { font: 800 20px var(--font-display); }
.big small { font-size: 13px; font-weight: 700; color: rgba(255, 255, 255, .88); }

/* Row 3 */
.section-head { display: flex; flex-wrap: wrap; align-items: baseline; justify-content: space-between; gap: 4px 12px; margin-bottom: 12px; }
.section-head h2 { font: 800 18px var(--font-display); color: var(--forest); }
.section-head a { font-weight: 800; font-size: 14px; color: var(--teal); }
.stats { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.note { margin-top: 10px; color: var(--ink-soft); font-size: 13px; }
.error { color: var(--danger); font-weight: 700; }
.stat { display: grid; justify-items: center; align-content: start; gap: 4px; min-width: 0; padding: 14px 8px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--card); box-shadow: var(--shadow); text-align: center; }
.stat b { font: 800 26px/1.1 var(--font-display); color: var(--forest); }
.stat small { font-weight: 800; font-size: 12.5px; color: var(--ink-soft); overflow-wrap: anywhere; }
.chip { display: grid; place-items: center; width: 36px; height: 36px; border-radius: 11px; }
.chip.blue { background: #E8F0FE; color: var(--stat-blue); } .chip.purple { background: #F0EBFE; color: var(--stat-purple); } .chip.orange { background: #FFF1DC; color: var(--stat-orange); }
.empty { padding: 26px; border: 1.5px dashed var(--line); border-radius: var(--radius-md); background: var(--card); text-align: center; color: var(--ink-soft); }
.empty button { display: block; margin: 14px auto 0; padding: 11px 22px; border: 0; border-radius: 14px; background: var(--forest); color: #fff; font: 800 15px var(--font-display); }
.recent { display: flex; align-items: center; gap: 14px; width: 100%; margin-bottom: 10px; padding: 14px 16px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--card); text-align: left; }
.recent:hover { border-color: var(--leaf); }
.grow { flex: 1; min-width: 0; display: grid; }
.grow b { font: 700 16px var(--font-display); } .grow small { color: var(--ink-soft); }
.badge { flex: none; max-width: 55%; padding: 5px 11px; border-radius: 999px; font: 800 13px var(--font-body); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.badge.ok { background: var(--tint); color: var(--forest); } .badge.warn { background: var(--warn-tint); color: #B4432A; }

/* Tablet: single column, the two big buttons sit side by side */
@media (max-width: 900px) {
  .dash-grid { grid-template-columns: 1fr; }
  .big:nth-of-type(1), .big:nth-of-type(2) { grid-column: auto; }
  .greet h1 { font-size: 22px; }
}
@media (min-width: 560px) and (max-width: 900px) {
  .dash-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .greet, .schedule, .col { grid-column: 1 / -1; }
}

/* Phones */
@media (max-width: 520px) {
  .dash-grid { gap: 12px; }
  .card { min-height: 0; padding: 14px 16px; gap: 12px; }
  .greet .avatar { width: 52px; height: 52px; font-size: 18px; }
  .greet h1 { font-size: 20px; }
  .tile { width: 42px; height: 42px; }
  .txt b { font-size: 16px; }
  .txt small { font-size: 13px; }

  /* Big buttons become compact horizontal rows: icon left, text right */
  .big { grid-template-columns: auto minmax(0, 1fr); grid-template-rows: auto auto; justify-items: start; align-content: center; column-gap: 14px; row-gap: 2px; min-height: 0; padding: 16px; text-align: left; }
  .big :deep(svg) { grid-row: 1 / span 2; align-self: center; }
  .big b { font-size: 17px; }

  /* Keep the three stats in one row, just tighter */
  .stats { gap: 8px; }
  .stat { padding: 12px 4px; }
  .stat b { font-size: 22px; }
  .stat small { font-size: 11.5px; }
  .chip { width: 32px; height: 32px; }

  .recent { padding: 12px 14px; gap: 10px; }
  .badge { font-size: 12px; padding: 4px 9px; }
}

@media (max-width: 360px) {
  .greet h1 { font-size: 18px; }
  .stat small { font-size: 11px; }
}
</style>