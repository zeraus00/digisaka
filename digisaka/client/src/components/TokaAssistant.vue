<script setup>
import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useTokaAssistantStore } from '../stores/tokaAssistant.js';
import TokaAssistantChat from './TokaAssistantChat.vue';

const route = useRoute();
const assistant = useTokaAssistantStore();
const open = ref(false), launcher = ref(null), position = ref(null), popoverStyle = ref();
const dragging = ref(null), suppressClick = ref(false);
const assistantVisible = computed(() => assistant.enabled && !assistant.expanded
  && !['/assistant', '/profile'].includes(route.path));
const launcherStyle = computed(() => position.value ? {
  left: `${position.value.x}px`,
  top: `${position.value.y}px`,
  right: 'auto',
  bottom: 'auto',
} : undefined);
async function positionPopover() {
  await nextTick();
  if (!open.value || !launcher.value || !window.matchMedia('(max-width: 900px)').matches) {
    popoverStyle.value = undefined;
    return;
  }
  const bounds = launcher.value.getBoundingClientRect();
  const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 64;
  const topLimit = headerHeight + 12;
  const height = Math.max(120, Math.min(440, bounds.top - topLimit - 12));
  popoverStyle.value = {
    top: `${Math.max(8, bounds.top - height - 12)}px`,
    bottom: 'auto',
    height: `${height}px`,
  };
}
const close = () => { open.value = false; };
function toggle() {
  if (!open.value) position.value = null;
  open.value = !open.value;
}
const expand = () => {
  close();
  assistant.openExpanded();
};
function startDrag(event) {
  if (open.value || event.button !== 0) return;
  const bounds = launcher.value?.getBoundingClientRect();
  if (!bounds) return;
  dragging.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    originX: bounds.left,
    originY: bounds.top,
    moved: false,
  };
  event.currentTarget.setPointerCapture(event.pointerId);
}
function moveDrag(event) {
  const drag = dragging.value;
  if (!drag || event.pointerId !== drag.pointerId) return;
  const deltaX = event.clientX - drag.startX;
  const deltaY = event.clientY - drag.startY;
  if (!drag.moved && Math.hypot(deltaX, deltaY) < 5) return;
  drag.moved = true;
  const bounds = launcher.value.getBoundingClientRect();
  position.value = {
    x: Math.max(8, Math.min(document.documentElement.clientWidth - bounds.width - 8, drag.originX + deltaX)),
    y: Math.max(8, Math.min(document.documentElement.clientHeight - bounds.height - 8, drag.originY + deltaY)),
  };
}
function endDrag(event) {
  const drag = dragging.value;
  if (!drag || event.pointerId !== drag.pointerId) return;
  dragging.value = null;
  if (!drag.moved) return;
  suppressClick.value = true;
  const bounds = launcher.value.getBoundingClientRect();
  const viewportWidth = document.documentElement.clientWidth;
  const viewportHeight = document.documentElement.clientHeight;
  const x = drag.originX + event.clientX - drag.startX;
  const y = drag.originY + event.clientY - drag.startY;
  const sideX = x + bounds.width / 2 < viewportWidth / 2
    ? 8
    : viewportWidth - bounds.width - 8;
  position.value = {
    x: sideX,
    y: Math.max(8, Math.min(viewportHeight - bounds.height - 8, y)),
  };
}
function cancelDrag(event) {
  if (dragging.value?.pointerId === event.pointerId) dragging.value = null;
}
function onLauncherClick(event) {
  if (suppressClick.value) {
    suppressClick.value = false;
    event.preventDefault();
    return;
  }
  toggle();
}
function onKeydown(event) {
  if (event.key === 'Escape' && open.value) {
    close();
    launcher.value?.focus();
  }
}
watch(() => open.value, (isOpen) => {
  if (isOpen) positionPopover();
  else popoverStyle.value = undefined;
});
watch(() => route.path, close);
watch(() => assistant.enabled, (enabled) => { if (!enabled) close(); });
onMounted(() => {
  document.addEventListener('keydown', onKeydown);
  window.addEventListener('resize', positionPopover);
});
onUnmounted(() => {
  document.removeEventListener('keydown', onKeydown);
  window.removeEventListener('resize', positionPopover);
});
</script>

<template>
  <Transition name="assistant-launcher">
    <div v-if="assistantVisible" class="assistant-launcher" :style="launcherStyle">
      <Transition name="assistant-pop">
        <div v-if="open" id="toka-assistant-panel" class="assistant-popover" :style="popoverStyle">
          <TokaAssistantChat @close="close" @expand="expand" />
        </div>
      </Transition>
      <button
        ref="launcher"
        type="button"
        class="assistant-orb"
        :aria-label="open ? 'Close Toka assistant' : 'Open Toka assistant'"
        :aria-expanded="open"
        aria-controls="toka-assistant-panel"
        :class="{ 'assistant-orb--dragging': dragging?.moved, 'assistant-orb--open': open }"
        @pointerdown="startDrag"
        @pointermove="moveDrag"
        @pointerup="endDrag"
        @pointercancel="cancelDrag"
        @click="onLauncherClick"
      >
        <img src="../assets/toka-chatbot.png" alt="">
      </button>
    </div>
  </Transition>
  <Transition name="assistant-expanded">
    <div v-if="assistant.expanded && assistant.enabled" class="assistant-expanded">
      <aside class="assistant-expanded-panel">
        <TokaAssistantChat full-page @close="assistant.closeExpanded()" />
      </aside>
    </div>
  </Transition>
</template>

<style scoped>
.assistant-launcher { position: fixed; right: 24px; bottom: 82px; z-index: 55; }
.assistant-orb { position: relative; display: grid; place-items: center; width: 64px; height: 64px; padding: 0; border: 3px solid #fff; border-radius: 50%; background: #278c43; box-shadow: 0 5px 18px rgba(13, 75, 35, .28); cursor: grab; touch-action: none; user-select: none; }
.assistant-orb img { display: block; width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
.assistant-orb--dragging { cursor: grabbing; }
.assistant-orb--open { cursor: pointer; touch-action: auto; }
.assistant-orb:hover { transform: translateY(-2px); box-shadow: 0 8px 22px rgba(13, 75, 35, .34); }
.assistant-orb:focus-visible { outline: 3px solid #ffc93c; outline-offset: 3px; }
.assistant-popover { position: absolute; right: 0; bottom: 78px; width: min(380px, calc(100vw - 32px)); height: min(530px, calc(100dvh - 190px)); overflow: hidden; border: 1px solid #cbd2cb; border-radius: 18px; background: #f4f6f4; box-shadow: 0 16px 42px rgba(10, 35, 18, .24); }
.assistant-launcher-enter-active, .assistant-launcher-leave-active { transition: opacity .22s ease, transform .22s ease; }
.assistant-launcher-enter-from, .assistant-launcher-leave-to { opacity: 0; transform: translateY(12px) scale(.8); }
.assistant-pop-enter-active, .assistant-pop-leave-active { transition: opacity .16s ease, transform .16s ease; }
.assistant-pop-enter-from, .assistant-pop-leave-to { opacity: 0; transform: translateY(8px) scale(.98); }
.assistant-expanded { position: fixed; inset: 0; z-index: 100; pointer-events: none; }
.assistant-expanded-panel { position: absolute; inset: 0 0 0 auto; display: flex; width: min(360px, 100vw); height: 100%; overflow: hidden; background: #f4f6f4; box-shadow: -12px 0 36px rgba(10, 35, 18, .2); pointer-events: auto; }
.assistant-expanded-enter-active, .assistant-expanded-leave-active { transition: opacity .2s ease, transform .2s ease; }
.assistant-expanded-enter-from, .assistant-expanded-leave-to { opacity: 0; transform: translateX(24px); }
@media (max-width: 900px) {
  .assistant-launcher { right: 16px; bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px) + 118px); }
  .assistant-orb { width: 58px; height: 58px; }
  .assistant-popover { position: fixed; right: 10px; width: calc(100vw - 20px); }
  .assistant-expanded-panel { width: 100vw; }
}
@media (prefers-reduced-motion: reduce) {
  .assistant-launcher-enter-active, .assistant-launcher-leave-active,
  .assistant-pop-enter-active, .assistant-pop-leave-active,
  .assistant-expanded-enter-active, .assistant-expanded-leave-active { transition: none; }
  .assistant-orb:hover { transform: none; }
}
</style>
