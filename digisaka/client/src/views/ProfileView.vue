<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import Icon from '../components/Icon.vue';
import PageHeader from '../components/PageHeader.vue';

const auth = useAuthStore(), router = useRouter();
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
</script>

<template>
  <div class="page profile-page">
    <PageHeader title="My Profile" subtitle="Manage your account information." />

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

    <button type="button" class="profile-logout" @click="signOut">
      <Icon name="logout" :size="20" />
      <span>Sign Out</span>
    </button>
  </div>
</template>

<style scoped>
.profile-page { max-width: 700px; }
.profile-hero {
  display: grid;
  justify-items: center;
  gap: 5px;
  margin-bottom: 22px;
  padding: 24px 16px;
  border-radius: 16px;
  background: linear-gradient(135deg, #8fb996, #f3e8bf);
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
.profile-hero strong { color: #1e6b32; font: 800 18px var(--font-display); overflow-wrap: anywhere; }
.profile-hero > span { color: #333; font-size: 13px; text-transform: capitalize; }
.section-label { margin: 0 0 8px; color: var(--ink-soft); font-size: 13px; font-weight: 700; }
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

@media (max-width: 900px) {
  .profile-page { padding-top: 20px; }
  .profile-page { max-width: 430px; }
}
</style>
