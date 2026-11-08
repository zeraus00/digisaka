import { defineStore } from 'pinia';
import { ASSISTANT_STARTER_MESSAGE, stubReplyFor } from '../stubs/tokaAssistant.js';

const starterMessages = () => [structuredClone(ASSISTANT_STARTER_MESSAGE)];

export const useTokaAssistantStore = defineStore('tokaAssistant', {
  state: () => ({ messages: starterMessages(), nextId: 1, enabled: true, expanded: false }),
  actions: {
    toggleEnabled() {
      this.enabled = !this.enabled;
      if (!this.enabled) this.expanded = false;
    },
    openExpanded() {
      if (this.enabled) this.expanded = true;
    },
    closeExpanded() {
      this.expanded = false;
    },
    send(text) {
      const clean = text.trim();
      if (!clean) return;
      this.messages.push({ id: `user-${this.nextId++}`, role: 'user', text: clean });
      this.messages.push({ id: `toka-${this.nextId++}`, role: 'assistant', ...stubReplyFor(clean) });
    },
    reset() {
      this.messages = starterMessages();
      this.nextId = 1;
    },
  },
});
