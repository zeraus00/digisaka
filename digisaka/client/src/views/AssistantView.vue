<script setup>
import { useRouter } from 'vue-router';
import TokaAssistantChat from '../components/TokaAssistantChat.vue';
import { useTokaAssistantStore } from '../stores/tokaAssistant.js';

const router = useRouter();
const assistant = useTokaAssistantStore();
function closeAssistant() {
  router.push(assistant.returnPath || '/');
}
</script>

<template>
  <main class="assistant-fullscreen">
    <aside class="assistant-panel">
      <TokaAssistantChat full-page @close="closeAssistant" />
    </aside>
  </main>
</template>

<style scoped>
.assistant-fullscreen {
  position: fixed;
  inset: 0;
  z-index: 100;
  width: 100vw;
  height: 100dvh;
  overflow: hidden;
  pointer-events: none;
}
.assistant-panel {
  position: absolute;
  inset: 0 0 0 auto;
  display: flex;
  width: min(480px, 100vw);
  height: 100%;
  overflow: hidden;
  background: #f4f6f4;
  box-shadow: -12px 0 36px rgba(10, 35, 18, .2);
  pointer-events: auto;
}
@media (max-width: 600px) {
  .assistant-panel { width: 100vw; }
}
</style>
