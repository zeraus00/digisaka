<script setup>
import PageHeader from '../components/PageHeader.vue';
import Icon from '../components/Icon.vue';
import { RouterLink } from 'vue-router';
import { useTokaAssistantStore } from '../stores/tokaAssistant.js';

const assistant = useTokaAssistantStore();
const MORE_ITEMS = [
  {
    icon: 'settings',
    title: 'Farm preferences',
    description: 'Manage your farm and app preferences.',
  },
  {
    icon: 'accessibility',
    title: 'Display & accessibility',
    description: 'Choose a display style and accessibility options.',
  },
  {
    icon: 'assistant',
    title: 'Toka AI Assistant',
    description: 'Get help understanding scans and treatment suggestions.',
    to: '/assistant',
  },
];
</script>

<template>
  <div class="page more-page">
    <PageHeader title="More" subtitle="Additional tools and preferences for your Toka AI account." />

    <section class="more-list" aria-label="More features">
      <component
        :is="item.to && assistant.enabled ? RouterLink : 'button'"
        v-for="item in MORE_ITEMS"
        :key="item.title"
        :to="item.to && assistant.enabled ? item.to : undefined"
        type="button"
        class="more-item"
        :class="{ 'more-item--available': item.to && assistant.enabled }"
        :disabled="!item.to || !assistant.enabled"
      >
        <span class="more-icon"><Icon :name="item.icon" :size="22" /></span>
        <span class="more-copy">
          <strong>{{ item.title }}</strong>
          <span>{{ item.description }}</span>
        </span>
        <span class="coming-soon">{{ item.to ? (assistant.enabled ? 'Open assistant' : 'Assistant off') : 'Coming soon' }}</span>
      </component>
    </section>
  </div>
</template>

<style scoped>
.more-page { max-width: 760px; }
.more-list { display: grid; gap: 10px; }
.more-item {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 78px;
  padding: 14px;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: #fff;
  box-shadow: var(--shadow);
  text-align: left;
  cursor: not-allowed;
}
.more-item:disabled { opacity: 1; }
.more-item--available { cursor: pointer; color: inherit; }
.more-item--available:hover { border-color: var(--leaf); transform: translateY(-1px); }
.more-icon {
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  flex: none;
  border-radius: 12px;
  background: var(--tint);
  color: var(--forest);
}
.more-copy { display: grid; gap: 3px; min-width: 0; }
.more-copy strong { color: var(--ink); font: 800 15px var(--font-display); }
.more-copy > span { color: var(--ink-soft); font-size: 13px; }
.coming-soon {
  flex: none;
  margin-left: auto;
  padding: 4px 8px;
  border-radius: 999px;
  background: #f0f2ef;
  color: var(--ink-soft);
  font-size: 10px;
  font-weight: 800;
  text-transform: uppercase;
}
@media (max-width: 520px) {
  .more-item { gap: 10px; padding: 12px; }
  .more-icon { width: 40px; height: 40px; }
  .more-copy strong { font-size: 14px; }
  .more-copy > span { font-size: 12px; }
  .coming-soon { padding: 4px 6px; font-size: 9px; }
}
</style>
