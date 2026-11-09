<script setup>
import { computed } from 'vue';
import Icon from './Icon.vue';
import MissedFlame from './MissedFlame.vue';

const props = defineProps({
  kind: { type: String, default: 'event' }, // 'event' | 'recorded' | 'missed'
  icon: { type: String, default: '' }, // icon name for 'event' kind
});
const label = computed(() => {
  if (props.kind === 'recorded') return 'Recorded';
  if (props.kind === 'missed') return 'Missed';
  if (props.icon === 'drop') return 'Spray window';
  if (props.icon === 'search') return 'Scan';
  return 'Event';
});
</script>

<template>
  <span class="badge" :class="`badge--${kind}`" :aria-label="label" :title="label">
    <MissedFlame v-if="kind === 'missed'" :size="14" label="Missed" />
    <Icon v-else-if="kind === 'recorded'" name="check" :size="10" />
    <Icon v-else :name="icon" :size="10" />
  </span>
</template>

<style scoped>
.badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  box-sizing: border-box;
  border-radius: 50%;
  border: 2px solid #fff;
  flex-shrink: 0;
}
.badge--event { background: #16A34A; color: #fff; }
.badge--recorded { background: #16A34A; color: #fff; }
/* white badge so the flame is clearly visible on the light red circle */
.badge--missed { width: 20px; height: 20px; background: #fff; border-color: #fff; box-shadow: 0 0 0 1px #FECACA; }
.badge .icon { width: 10px; height: 10px; flex: none; }
</style>