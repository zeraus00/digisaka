<script setup>
import { useRouter } from 'vue-router';
import TokaAssistantChat from '../components/TokaAssistantChat.vue';

const router = useRouter();
</script>

<template>
  <main class="assistant-fullscreen">
    <TokaAssistantChat full-page @close="router.push('/')" />
  </main>
</template>

<style scoped>
.assistant-fullscreen { position: fixed; inset: 0; z-index: 1000; display: flex; width: 100vw; height: 100dvh; min-height: 100vh; overflow: hidden; background: #f4f6f4; }
</style>
