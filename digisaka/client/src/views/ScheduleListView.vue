<script setup>
import { lineLabel } from '../helpers/stubSamples.js';
import { onMounted } from 'vue';
import { useRouter } from 'vue-router';
import PageHeader from '../components/PageHeader.vue';
import SkeletonList from '../components/SkeletonList.vue';
import { useLinesStore, weekRows } from '../stores/lines.js';

const router = useRouter(), lines = useLinesStore();
onMounted(() => lines.load());
// A line opens on its newest finished week; the treatment page always shows the line's current suggestion.
const open = (l) => router.push(`/treatment/${encodeURIComponent(l.line_id)}/${encodeURIComponent(weekRows(l)[0].week)}`);
</script>

<template>
  <div class="page">
    <PageHeader title="Scheduled Treatments" subtitle="Lines with a finished week — tap a line to see its suggestions." />
    <SkeletonList v-if="lines.loading && !lines.statuses.length" />
    <p v-else-if="lines.error" class="error">{{ lines.error }}</p>
    <p v-else-if="lines.loaded && !lines.withCycles.length" class="empty">No treatments have been suggested yet. Scan a line-week to see one here.</p>
    <button v-for="l in lines.withCycles" :key="l.line_id" class="card" type="button" @click="open(l)">
      <span class="thumb">🌱</span>
      <span class="body"><span class="name">Line {{ lineLabel(l.line_id) }}</span><span class="sub">{{ l.human_review_required ? 'Human review required' : 'Treatment suggestions' }}</span></span>
      <span class="count">{{ l.cycles.length }} {{ l.cycles.length === 1 ? 'week' : 'weeks' }}</span>
      <span class="chev">›</span>
    </button>
  </div>
</template>

<style scoped>
.error { color: var(--danger); font-weight: 700; }
.empty { padding: 30px; text-align: center; color: var(--ink-soft); border: 1.5px dashed var(--line); border-radius: var(--radius-md); background: var(--card); }
.card { display: flex; align-items: center; gap: 14px; width: 100%; margin-bottom: 10px; padding: 16px; border: 1px solid var(--line); border-radius: var(--radius-md); background: var(--card); box-shadow: var(--shadow); text-align: left; }
.card:hover { border-color: var(--leaf); }
.thumb { display: grid; place-items: center; flex: none; width: 44px; height: 44px; border-radius: 12px; background: var(--tint); font-size: 20px; }
.body { flex: 1; min-width: 0; display: grid; gap: 2px; }
.name { font: 800 16px var(--font-display); }
.sub { font-size: 13.5px; color: var(--ink-soft); }
.count { flex: none; font-size: 13px; font-weight: 800; color: var(--teal); }
.chev { flex: none; font-size: 20px; color: var(--ink-soft); }
</style>
