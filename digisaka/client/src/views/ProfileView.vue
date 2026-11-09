<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useTokaAssistantStore } from '../stores/tokaAssistant.js';
import Icon from '../components/Icon.vue';
import PageHeader from '../components/PageHeader.vue';

const auth = useAuthStore(), router = useRouter();
const assistant = useTokaAssistantStore();
const ROLE_LABELS = {
  practitioner: 'Practitioner',
  administrator: 'Administrator',
  domain_expert: 'Domain expert',
  plant_pathologist: 'Plant pathologist',
};
const accountType = computed(() => auth.roles.length
  ? auth.roles.map((role) => ROLE_LABELS[role] ?? role).join(', ')
  : 'Account');

function signOut() {
  auth.signOut();
  router.push('/login');
}

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
    action: 'assistant',
  },
];
</script>

<template>
  <div class="page profile-page">
    <PageHeader title="My Profile" subtitle="Manage your account information and preferences." />

    <section class="profile-hero" aria-label="Profile">
      <div class="profile-avatar" aria-hidden="true">{{ auth.initials }}</div>
      <strong>{{ auth.email || 'Signed-in user' }}</strong>
      <span>{{ accountType }}</span>
    </section>

    <h2 class="section-label">Account</h2>
    <section class="profile-card" aria-label="Account information">
      <div class="profile-row">
        <span class="row-icon"><Icon name="user" :size="22" /></span>
        <span class="row-label">User Information</span>
      </div>
      <div class="profile-detail">
        <span>Email</span>
        <strong>{{ auth.email || 'Not available' }}</strong>
      </div>
      <div class="profile-detail">
        <span>Account type</span>
        <strong>{{ accountType }}</strong>
      </div>
      <div class="profile-row profile-language">
        <span class="row-icon"><span aria-hidden="true">文</span></span>
        <span class="row-label">Language</span>
        <span class="row-value">English <span aria-hidden="true">›</span></span>
      </div>
      <div class="profile-row profile-about">
        <span class="row-icon"><span aria-hidden="true">i</span></span>
        <span class="row-label">About Toka AI</span>
      </div>
      <p class="about-copy">Toka AI helps farmers monitor banana leaf health and manage treatment schedules.</p>
    </section>

    <h2 class="section-label more-settings">More settings</h2>
    <section class="more-list" aria-label="More features">
      <button
        v-for="item in MORE_ITEMS"
        :key="item.title"
        type="button"
        class="more-item"
        :class="{ 'more-item--available': item.action && assistant.enabled }"
        :disabled="!item.action || !assistant.enabled"
        @click="item.action === 'assistant' && assistant.openExpanded()"
      >
        <span class="more-icon"><Icon :name="item.icon" :size="22" /></span>
        <span class="more-copy">
          <strong>{{ item.title }}</strong>
          <span>{{ item.description }}</span>
        </span>
        <span class="coming-soon">{{ item.action ? (assistant.enabled ? 'Open assistant' : 'Assistant off') : 'Coming soon' }}</span>
      </button>
    </section>

    <button type="button" class="profile-logout" @click="signOut">
      <Icon name="logout" :size="20" />
      <span>Sign Out</span>
    </button>
  </div>
</template>

<style scoped>
/* No width rule here: the page uses the shared .page width, same as Leaf Scan. */
.profile-hero {
  display: grid;
  justify-items: center;
  gap: 5px;
  margin-bottom: 22px;
  padding: 24px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #6FA57C 0%, #A8C79B 55%, #EADFB4 100%);
  text-align: center;
}
.profile-avatar {
  display: grid;
  place-items: center;
  width: 72px;
  height: 72px;
  margin-bottom: 5px;
  border-radius: 50%;
  background: var(--forest);
  color: #fff;
  font: 800 24px var(--font-display);
}
.profile-hero strong { color: #14532D; font: 800 18px var(--font-display); overflow-wrap: anywhere; }
.profile-hero > span { color: #2B3A2B; font-size: 13px; text-transform: capitalize; }
.section-label { margin: 0 0 8px; color: var(--ink-soft); font-size: 13px; font-weight: 700; }
.more-settings { margin-top: 22px; }
.profile-card { padding: 8px 14px; border: 1px solid var(--line); border-radius: 12px; background: #fff; box-shadow: var(--shadow); }
.profile-row { display: flex; align-items: center; gap: 14px; min-height: 60px; color: var(--ink); }
.row-icon { display: grid; place-items: center; width: 40px; height: 40px; flex: none; border-radius: 10px; background: #e9e3c4; color: #2d5a2d; }
.row-icon > span { font: 800 20px var(--font-display); }
.row-label { font-weight: 800; }
.profile-detail { display: grid; gap: 2px; margin: 0 0 12px 54px; font-size: 13px; }
.profile-detail > span { color: var(--ink-soft); }
.profile-detail strong { overflow-wrap: anywhere; font-weight: 700; }
.profile-language, .profile-about { border-top: 1px solid var(--line); }
.row-value { margin-left: auto; color: var(--ink-soft); font-size: 14px; font-weight: 400; }
.about-copy { margin: 0 0 8px 54px; color: var(--ink-soft); font-size: 13px; }
.profile-logout {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  min-height: 54px;
  margin-top: 12px;
  padding: 10px 14px;
  border: 1px solid var(--line);
  border-radius: 12px;
  background: #fff;
  color: var(--forest);
  font-weight: 800;
  text-align: left;
}
.profile-logout:hover { background: var(--tint); }
.profile-logout:focus-visible { outline: 3px solid var(--leaf); outline-offset: 2px; }

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

@media (max-width: 900px) {
  .profile-page { padding-top: 20px; }
}
</style>