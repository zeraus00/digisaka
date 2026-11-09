<script setup>
import { ref } from 'vue';

// Animated flame for a missed schedule. Uses src/assets/fire.gif if it exists;
// otherwise (or if the GIF fails to load) it shows an inline flickering SVG flame.
defineProps({ size: { type: Number, default: 18 }, label: { type: String, default: 'Missed' } });

const gifs = import.meta.glob('../assets/fire.gif', { eager: true, import: 'default' });
const gifSrc = Object.values(gifs)[0] ?? '';
const useSvg = ref(!gifSrc);
</script>

<template>
  <span class="flame" :style="{ width: size + 'px', height: size + 'px' }" :title="label" :aria-label="label" role="img">
    <img v-if="!useSvg" :src="gifSrc" alt="" @error="useSvg = true" />
    <svg v-else viewBox="0 0 24 24" aria-hidden="true">
      <path class="outer" d="M12 2c.6 3.2-1.2 4.8-2.8 6.6C7.5 10.4 6 12.2 6 15a6 6 0 0 0 12 0c0-2.4-1.1-4.2-2.4-5.6-.4 1.3-1 2.1-1.9 2.6.5-3.8-.2-7.6-1.7-10Z" fill="#F97316" />
      <path class="inner" d="M12 22a3.6 3.6 0 0 1-3.6-3.6c0-1.9 1.3-3 2.3-4.2.5-.6.9-1.3 1-2.2 1.9 1.6 3.9 3.4 3.9 6.4A3.6 3.6 0 0 1 12 22Z" fill="#FDE047" />
    </svg>
  </span>
</template>

<style scoped>
.flame { display: inline-flex; background: transparent; line-height: 0; }
.flame img, .flame svg { width: 100%; height: 100%; display: block; object-fit: contain; }
.flame svg { transform-origin: 50% 90%; animation: flick 0.9s ease-in-out infinite alternate; }
.inner { transform-origin: 50% 90%; animation: flick-in 0.6s ease-in-out infinite alternate; }
@keyframes flick { 0% { transform: scale(1, 1) rotate(-2deg); } 100% { transform: scale(0.94, 1.08) rotate(2deg); } }
@keyframes flick-in { 0% { transform: scale(1); opacity: .9; } 100% { transform: scale(0.88, 1.1); opacity: 1; } }
@media (prefers-reduced-motion: reduce) { .flame svg, .inner { animation: none; } }
</style>