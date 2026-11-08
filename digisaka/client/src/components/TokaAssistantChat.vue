<script setup>
import { nextTick, onMounted, ref, watch } from 'vue';
import { RouterLink } from 'vue-router';
import { useTokaAssistantStore } from '../stores/tokaAssistant.js';
import { ASSISTANT_QUICK_PROMPTS } from '../stubs/tokaAssistant.js';

defineProps({ fullPage: { type: Boolean, default: false } });
const emit = defineEmits(['close', 'expand']);
const store = useTokaAssistantStore();
const draft = ref('');
const transcript = ref(null);

async function scrollToLatest() {
  await nextTick();
  if (transcript.value) transcript.value.scrollTop = transcript.value.scrollHeight;
}

function send(text = draft.value) {
  store.send(text);
  draft.value = '';
  scrollToLatest();
}

watch(() => store.messages.length, scrollToLatest);
onMounted(scrollToLatest);
</script>

<template>
  <section class="assistant-chat" :class="{ 'assistant-chat--full': fullPage }" aria-label="Toka AI Assistant">
    <header class="chat-header">
      <img class="chat-logo" src="../assets/toka-chatbot.png" alt="">
      <div class="chat-heading">
        <strong>Toka</strong>
        <span><i aria-hidden="true"></i> Demo assistant · sample replies</span>
      </div>
      <button v-if="!fullPage" type="button" class="header-button" aria-label="Open full-screen chat" title="Open full-screen chat" @click="emit('expand')">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 4H4v4M16 4h4v4M4 16v4h4M20 16v4h-4"/></svg>
      </button>
      <button type="button" class="header-button" :aria-label="fullPage ? 'Back to dashboard' : 'Close chat'" @click="emit('close')">
        <svg v-if="fullPage" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 18l-6-6 6-6M9 12h11"/></svg>
        <svg v-else viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>
    </header>

    <div ref="transcript" class="chat-transcript" aria-live="polite">
      <div v-for="message in store.messages" :key="message.id" class="message-row" :class="`message-row--${message.role}`">
        <img v-if="message.role === 'assistant'" class="message-logo" src="../assets/toka-chatbot.png" alt="">
        <div class="message-content">
          <p class="message-bubble">{{ message.text }}</p>
          <div v-if="message.card" class="message-card">
            <strong>{{ message.card.title }}</strong>
            <span>{{ message.card.detail }}</span>
            <RouterLink v-if="message.card.action" :to="message.card.action.to" class="message-action">
              {{ message.card.action.label }} <span aria-hidden="true">→</span>
            </RouterLink>
          </div>
        </div>
      </div>
      <div v-if="store.messages.length === 1" class="quick-prompts" aria-label="Suggested questions">
        <button v-for="prompt in ASSISTANT_QUICK_PROMPTS" :key="prompt" type="button" @click="send(prompt)">{{ prompt }}</button>
      </div>
    </div>

    <form class="chat-composer" @submit.prevent="send()">
      <label class="sr-only" for="toka-chat-message">Message Toka</label>
      <input id="toka-chat-message" v-model="draft" autocomplete="off" placeholder="Ask Toka a question…" />
      <button type="submit" class="send-button" :disabled="!draft.trim()" aria-label="Send message">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 5l7 7-7 7"/></svg>
      </button>
    </form>
    <p class="demo-disclaimer">Demo only. Replies use sample information, not live AI or farm advice.</p>
  </section>
</template>

<style scoped>
.assistant-chat { display: flex; flex-direction: column; width: 100%; height: 100%; min-height: 0; box-sizing: border-box; overflow: hidden; background: #f4f6f4; color: #1f2937; font-family: var(--font-body); }
.chat-header { display: flex; align-items: center; gap: 10px; min-height: 66px; padding: 10px 12px; border-bottom: 1px solid #e2e8e3; background: #fff; }
.chat-logo { width: 40px; height: 40px; flex: none; border-radius: 50%; object-fit: cover; }
.chat-heading { display: grid; flex: 1; min-width: 0; gap: 2px; }
.chat-heading strong { color: #1b2a22; font: 800 16px var(--font-display); }
.chat-heading span { display: flex; align-items: center; gap: 5px; color: #6b7a72; font-size: 10px; }
.chat-heading i { width: 7px; height: 7px; border-radius: 50%; background: #8ca497; }
.header-button { display: grid; place-items: center; width: 40px; height: 40px; flex: none; border: 0; border-radius: 50%; background: #eef2ee; color: #46564c; cursor: pointer; }
.header-button:hover { background: #e2ece4; }
.header-button svg, .send-button svg { width: 18px; height: 18px; fill: none; stroke: currentColor; stroke-width: 1.8; stroke-linecap: round; stroke-linejoin: round; }
.chat-transcript { display: flex; flex: 1; flex-direction: column; gap: 12px; min-height: 0; overflow-y: auto; padding: 16px 14px; }
.message-row { display: flex; align-items: flex-start; gap: 8px; max-width: 92%; }
.message-row--user { align-self: flex-end; justify-content: flex-end; }
.message-logo { width: 30px; height: 30px; flex: none; border-radius: 50%; object-fit: cover; }
.message-content { display: grid; gap: 7px; min-width: 0; }
.message-bubble { width: fit-content; padding: 10px 12px; border: 1px solid #d5ddd6; border-radius: 4px 15px 15px; background: #fff; font-size: 13px; line-height: 1.5; overflow-wrap: anywhere; }
.message-row--user .message-bubble { justify-self: end; border: 0; border-radius: 15px 4px 15px 15px; background: #117a2a; color: #fff; }
.message-card { display: grid; gap: 6px; padding: 11px; border: 1px solid #d5ddd6; border-radius: 12px; background: #fff; }
.message-card strong { color: #1f2937; font-size: 12px; }
.message-card > span { color: #4b5563; font-size: 12px; line-height: 1.4; }
.message-action { color: #117a2a; font-size: 12px; font-weight: 800; }
.quick-prompts { display: flex; flex-wrap: wrap; gap: 7px; padding-left: 38px; }
.quick-prompts button { padding: 7px 10px; border: 1px solid #117a2a; border-radius: 999px; background: #fff; color: #117a2a; font: 700 11px var(--font-body); text-align: left; cursor: pointer; }
.quick-prompts button:hover { background: #e6f4e9; }
.chat-composer { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-top: 1px solid #e2e8e3; background: #fff; }
.chat-composer input { width: 0; height: 44px; flex: 1; padding: 0 15px; border: 1px solid #cbd2cb; border-radius: 999px; color: #1f2937; font: 13px var(--font-body); outline: none; }
.chat-composer input:focus { border-color: #117a2a; box-shadow: 0 0 0 2px #dff3e4; }
.send-button { display: grid; place-items: center; width: 42px; height: 42px; flex: none; border: 0; border-radius: 50%; background: #117a2a; color: #fff; cursor: pointer; }
.send-button:disabled { background: #eef2ee; color: #9aa59d; cursor: not-allowed; }
.demo-disclaimer { padding: 0 12px 9px; background: #fff; color: #6b7a72; font-size: 9px; text-align: center; }
.assistant-chat--full { width: 100%; height: 100%; }
.assistant-chat--full .chat-header { min-height: 72px; padding: 12px 20px; }
.assistant-chat--full .chat-transcript { width: min(1100px, 100%); align-self: center; gap: 16px; padding: 24px; }
.assistant-chat--full .message-row { max-width: 85%; }
.assistant-chat--full .message-bubble { padding: 12px 15px; font-size: 14px; }
.assistant-chat--full .quick-prompts { padding-left: 40px; }
.assistant-chat--full .chat-composer { justify-content: center; padding: 14px 20px; }
.assistant-chat--full .chat-composer input { width: min(1000px, 100%); flex: 0 1 1000px; }
.assistant-chat--full .demo-disclaimer { padding-bottom: 12px; font-size: 10px; }
.sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; }
</style>
