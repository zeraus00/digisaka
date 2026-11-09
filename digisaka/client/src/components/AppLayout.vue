<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, RouterLink, RouterView } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useDevClockStore } from '../stores/devClock.js';
import Icon from './Icon.vue';
import DevDateBar from './DevDateBar.vue';
import TokaAssistant from './TokaAssistant.vue';
import { useTokaAssistantStore } from '../stores/tokaAssistant.js';
import { useAccountMenu } from './useAccountMenu.js';

const scroller = ref(null);
const route = useRoute(), auth = useAuthStore();
const tokaAssistant = useTokaAssistantStore();
const title = computed(() => route.meta.title || 'Digisaka');
const notificationsOpen = ref(false);
const notifications = ref(null), notificationButton = ref(null);

const MENU = [
  { to: '/', label: 'Dashboard', icon: 'home' },
  { to: '/scan', label: 'Disease Detection', icon: 'scan' },
  { to: '/history', label: 'Diagnosis History', icon: 'history' },
  { to: '/schedule', label: 'Treatment Schedule', icon: 'calendar' },
  { to: '/profile', label: 'Profile', icon: 'user' },
];
const MOBILE_MENU = [
  { to: '/', label: 'Home', icon: 'home' },
  { to: '/scan', label: 'Scan', icon: 'scan' },
  { to: '/schedule', label: 'Calendar', icon: 'calendar' },
];

const { menuOpen, narrow, account, avatar, toggleMenu, closeMenu } = useAccountMenu(route);
function closeNotifications() { notificationsOpen.value = false; }
function toggleNotifications() { notificationsOpen.value = !notificationsOpen.value; }
function onDocumentClick(event) {
  if (notificationsOpen.value && !notifications.value?.contains(event.target) && !notificationButton.value?.contains(event.target)) {
    closeNotifications();
  }
}
function onDocumentKeydown(event) {
  if (event.key === 'Escape' && notificationsOpen.value) {
    closeNotifications();
    notificationButton.value?.focus();
  }
}
watch(() => route.path, () => { closeNotifications(); closeMenu(); });
onMounted(() => {
  document.addEventListener('click', onDocumentClick);
  document.addEventListener('keydown', onDocumentKeydown);
});
onUnmounted(() => {
  document.removeEventListener('click', onDocumentClick);
  document.removeEventListener('keydown', onDocumentKeydown);
});
onMounted(() => useDevClockStore().load());
</script>

<template>
  <div class="shell">
    <aside class="sidebar" aria-label="User navigation">
      <svg class="leaf-deco leaf-deco--1" aria-hidden="true" width="80" height="120" viewBox="0 0 80 120">
        <path d="M70 6C40 10 20 40 10 110C50 90 76 50 70 6Z" fill="#fff" opacity="0.07"/>
      </svg>
      <svg class="leaf-deco leaf-deco--2" aria-hidden="true" width="150" height="130" viewBox="0 0 150 130">
        <path d="M0 30C40 40 50 80 30 110C-10 90 -10 60 0 30Z" fill="#fff" opacity="0.08"/>
        <path d="M0 90C50 70 110 90 140 110C90 130 30 125 0 110Z" fill="#fff" opacity="0.08"/>
      </svg>
      <svg class="leaf-deco leaf-deco--3" aria-hidden="true" width="160" height="170" viewBox="0 0 160 170">
        <path d="M5 5C80 20 140 80 150 170H20C0 110 -5 50 5 5Z" fill="#fff" opacity="0.06"/>
        <path d="M130 0C165 30 160 100 140 140C110 100 110 40 130 0Z" fill="#fff" opacity="0.06"/>
      </svg>

      <div class="sidebar-brand">
        <span class="sidebar-mark" aria-hidden="true">
          <img src="../assets/bananaleaf2.png" alt="" width="40" height="40">
        </span>
        <span class="sidebar-title">Toka AI</span>
      </div>

      <div class="sidebar-section">Menu</div>

      <nav class="sidebar-nav" aria-label="User navigation">
        <ul class="sidebar-list" role="list">
          <li v-for="m in MENU" :key="m.to">
            <RouterLink
              :to="m.to"
              class="sidebar-link"
              :active-class="m.to === '/' ? '' : 'sidebar-link--active'"
              exact-active-class="sidebar-link--active"
            >
              <Icon :name="m.icon" :size="18" />
              <span class="sidebar-label">{{ m.label }}</span>
            </RouterLink>
          </li>
          <li v-if="auth.technicalUser">
            <RouterLink to="/admin" class="sidebar-link">
              <span class="sidebar-admin-icon" aria-hidden="true">↗</span>
              <span class="sidebar-label">Switch to Admin Web</span>
            </RouterLink>
          </li>
        </ul>
      </nav>
    </aside>

    <div class="main">
      <header class="topbar">
        <div class="topbar-brand" aria-label="Toka AI">
          <img src="../assets/bananaleaf-no-border.png" alt="" aria-hidden="true">
          <span>Toka AI</span>
        </div>
        <div class="where"><span class="mark small"><img src="../assets/bananaleaf2.png" alt="" aria-hidden="true"></span><h2>{{ title }}</h2></div>
        <div class="tools">
          <RouterLink to="/scan" class="pill"><Icon name="scan" :size="15" />New Scan</RouterLink>
          <button
            type="button"
            class="assistant-toggle"
            :class="{ 'assistant-toggle--enabled': tokaAssistant.enabled }"
            :aria-label="tokaAssistant.enabled ? 'Disable Toka assistant' : 'Enable Toka assistant'"
            :title="tokaAssistant.enabled ? 'Disable Toka assistant' : 'Enable Toka assistant'"
            :aria-pressed="tokaAssistant.enabled"
            @click="tokaAssistant.toggleEnabled"
          >
            <img src="../assets/toka-chatbot.png" alt="">
            <span>Toka</span>
            <span class="assistant-toggle-state">{{ tokaAssistant.enabled ? 'On' : 'Off' }}</span>
          </button>
          <div ref="notifications" class="notification-account">
            <button
              ref="notificationButton"
              type="button"
              class="notification-button"
              aria-label="Notifications"
              aria-haspopup="true"
              :aria-expanded="notificationsOpen"
              :aria-controls="notificationsOpen ? 'notification-panel' : undefined"
              @click="toggleNotifications"
            >
              <Icon name="bell" :size="19" />
            </button>
            <div v-if="notificationsOpen" id="notification-panel" class="notification-panel">
              <strong>Notifications</strong>
              <p>You’re all caught up. New updates will appear here.</p>
            </div>
          </div>
          <div ref="account" class="account">
            <button ref="avatar" type="button" class="avatar" :title="auth.email" :aria-label="narrow ? 'Profile' : 'Account'" :tabindex="narrow ? 0 : -1"
                    :aria-haspopup="narrow ? 'true' : undefined"
                    :aria-expanded="narrow ? menuOpen : undefined" :aria-controls="narrow ? 'account-menu' : undefined" @click="toggleMenu">
              <span>{{ auth.initials }}</span>
            </button>
            <div v-if="menuOpen" id="account-menu" class="menu">
              <p class="menu-who">{{ auth.email }}</p>
              <RouterLink to="/profile" class="menu-profile"><Icon name="user" :size="18" /><span>Profile</span></RouterLink>
            </div>
          </div>
        </div>
      </header>
      <main ref="scroller" class="content">
        <RouterView v-slot="{ Component, route }">
          <Transition name="page" mode="out-in" @after-leave="scroller.scrollTo({ top: 0 })">
            <div :key="route.path" class="route-wrap"><component :is="Component" /></div>
          </Transition>
        </RouterView>
      </main>
    </div>
    <nav class="mobile-nav" aria-label="Primary navigation">
      <RouterLink
        :to="MOBILE_MENU[0].to"
        class="mobile-nav-link"
        :aria-current="route.path === '/' ? 'page' : undefined"
      >
        <span class="mobile-nav-icon"><Icon :name="MOBILE_MENU[0].icon" :size="21" /></span>
        <span>Home</span>
      </RouterLink>
      <RouterLink
        v-for="item in MOBILE_MENU.slice(1)"
        :key="item.to"
        :to="item.to"
        class="mobile-nav-link"
        :class="{ 'mobile-nav-link--scan': item.to === '/scan' }"
        :aria-current="route.path === item.to || route.path.startsWith(`${item.to}/`) || (item.to === '/schedule' && route.path.startsWith('/treatment/')) ? 'page' : undefined"
      >
        <span class="mobile-nav-icon"><Icon :name="item.icon" :size="item.to === '/scan' ? 23 : 21" /></span>
        <span>{{ item.label }}</span>
      </RouterLink>
    </nav>
    <DevDateBar />
    <TokaAssistant />
  </div>
</template>

<style scoped>
.shell { --sidebar-w: 220px; display: grid; grid-template-columns: var(--sidebar-w) minmax(0, 1fr); height: 100dvh; min-height: 100vh; }
.sidebar { position: relative; width: var(--sidebar-w); height: 100dvh; overflow: hidden; background: #056b43; color: #fff; z-index: 20; }
.leaf-deco { position: absolute; z-index: 0; pointer-events: none; }
.leaf-deco--1 { top: 0; right: -10px; width: 80px; height: 120px; }
.leaf-deco--2 { top: 62%; left: -20px; width: 150px; height: 130px; }
.leaf-deco--3 { bottom: -24px; left: 100px; width: 160px; height: 170px; }
.sidebar-brand { position: absolute; top: 22px; left: 18px; z-index: 1; display: flex; align-items: center; gap: 10px; font: 800 22px var(--font-display); letter-spacing: -.3px; }
.sidebar-mark { display: grid; place-items: center; width: 40px; height: 43px; flex: none; }
.sidebar-mark img { display: block; width: 40px; height: 40px; object-fit: contain; }
.sidebar-title { white-space: nowrap; }
.sidebar-section { position: absolute; top: 97px; left: 18px; z-index: 1; color: rgba(255, 255, 255, .7); font: 700 12px/14px var(--font-display); }
.sidebar-nav { position: absolute; top: 128px; left: 16px; z-index: 1; width: calc(100% - 32px); }
.sidebar-list { display: flex; flex-direction: column; gap: 4px; }
.sidebar-link { display: flex; align-items: center; gap: 10px; width: 100%; height: 48px; padding: 0 7px; border: 0; border-radius: 8px; background: transparent; color: #fff; font: 600 14px var(--font-body); text-align: left; cursor: pointer; transition: background .15s ease; }
.sidebar-link:hover:not(.sidebar-link--active) { background: rgba(0, 0, 0, .12); }
.sidebar-link:focus-visible { outline: 3px solid var(--leaf-soft); outline-offset: 2px; }
.sidebar-link--active { background: #04583a; color: #fff; }
.sidebar-link .icon { width: 18px; height: 18px; flex: none; }
.sidebar-label { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.sidebar-admin-icon { display: grid; place-items: center; width: 18px; height: 18px; flex: none; font-size: 20px; line-height: 1; }
.main { display: flex; flex-direction: column; min-width: 0; height: 100dvh; }
.topbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; height: var(--header-h); min-height: var(--header-h); padding: 0 var(--gutter); border-bottom: 1px solid var(--line); background: #fff; flex: none; }
.where { display: flex; align-items: center; gap: 12px; min-width: 0; }
.where h2 { overflow: hidden; color: var(--forest); font: 800 20px var(--font-display); text-overflow: ellipsis; white-space: nowrap; }
.mark { display: grid; place-items: center; width: 40px; height: 40px; flex: none; }
.mark.small { width: 32px; height: 32px; }
.mark img { display: block; width: 32px; height: 32px; object-fit: contain; }
.tools { display: flex; align-items: center; gap: 10px; }
.pill { display: inline-flex; align-items: center; gap: 8px; height: 40px; padding: 0 18px; border: 1px solid var(--line); border-radius: 999px; background: #fff; color: var(--forest); font: 800 15px var(--font-display); }
.pill:hover { background: var(--tint); }
.assistant-toggle { display: inline-flex; align-items: center; gap: 6px; height: 40px; padding: 0 10px; border: 1px solid var(--line); border-radius: 999px; background: #fff; color: var(--ink-soft); font: 800 12px var(--font-body); cursor: pointer; transition: transform .18s ease, background-color .22s ease, border-color .22s ease, color .22s ease; }
.assistant-toggle:focus-visible { outline: 3px solid var(--leaf); outline-offset: 2px; }
.assistant-toggle:active { transform: scale(.94); }
.assistant-toggle img { width: 24px; height: 24px; border-radius: 50%; object-fit: cover; transition: transform .24s ease; }
.assistant-toggle--enabled { border-color: #b7d9bf; background: #eff8f0; color: var(--forest); }
.assistant-toggle--enabled img { transform: rotate(12deg) scale(1.06); }
.assistant-toggle-state { min-width: 22px; padding: 2px 5px; border-radius: 999px; background: #e9ece9; color: inherit; text-align: center; transition: background-color .22s ease, color .22s ease, transform .22s ease; }
.assistant-toggle--enabled .assistant-toggle-state { background: var(--forest); color: #fff; transform: scale(1.04); }
.avatar { position: relative; display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--leaf); color: #fff; font: 800 14px var(--font-display); }
.account { position: relative; }
.notification-account { position: relative; }
.notification-button { display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 50%; background: transparent; color: var(--ink-soft); }
.notification-button:hover { color: var(--forest); }
.notification-button:focus-visible, .avatar:focus-visible { outline: 3px solid var(--leaf); outline-offset: 2px; }
.notification-panel { position: absolute; top: calc(100% + 8px); right: 0; z-index: 40; width: min(280px, calc(100vw - 32px)); padding: 16px; border: 1px solid var(--line); border-radius: 14px; background: #fff; box-shadow: 0 8px 24px rgba(6, 40, 20, .18); }
.notification-panel strong { color: var(--ink); font: 800 15px var(--font-display); }
.notification-panel p { margin-top: 6px; color: var(--ink-soft); font-size: 13px; }
.menu { display: none; }
.menu-who { overflow: hidden; padding: 8px 12px; color: var(--ink-soft); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.content { flex: 1; min-height: 0; overflow-y: auto; }
.topbar-brand, .mobile-nav { display: none; }
.menu-profile { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border-radius: 10px; color: var(--forest); font: 800 14px var(--font-body); }
.menu-profile:hover { background: var(--tint); }

@media (max-width: 900px) {
  .shell { grid-template-columns: minmax(0, 1fr); grid-template-rows: 1fr; }
  .sidebar { display: none; }
  .main { height: 100dvh; }
  .topbar { height: 64px; min-height: 64px; }
  .topbar-brand { display: inline-flex; align-items: center; gap: 8px; color: var(--forest); font: 800 17px var(--font-display); white-space: nowrap; }
  .topbar-brand img { width: 30px; height: 30px; object-fit: contain; }
  .where { display: none; }
  .pill { display: none; }
  .assistant-toggle { width: 42px; justify-content: center; padding: 0; }
  .assistant-toggle > span { display: none; }
  .avatar { width: 40px; height: 40px; background: var(--leaf); color: #fff; cursor: pointer; }
  .menu { display: block; position: absolute; top: calc(100% + 8px); right: 0; z-index: 40; min-width: 220px; max-width: calc(100vw - 2 * var(--gutter)); padding: 8px; border: 1px solid var(--line); border-radius: 14px; background: #fff; box-shadow: 0 8px 24px rgba(6, 40, 20, .18); }
  .menu-who { max-width: 100%; padding: 6px 12px 8px; font-size: 12px; }
  .tools { gap: 8px; }
  .content { padding-bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px) + 16px); }
  .mobile-nav {
    position: fixed;
    inset: auto 0 0;
    z-index: 35;
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    height: calc(var(--tabbar-h) + env(safe-area-inset-bottom, 0px));
    padding: 4px 12px env(safe-area-inset-bottom, 0px);
    border-top: 1px solid var(--line);
    background: rgba(255, 255, 255, .98);
    box-shadow: 0 -4px 16px rgba(6, 40, 20, .08);
  }
  .mobile-nav-link {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 3px;
    min-width: 0;
    color: var(--ink-soft);
    font: 700 11px/1.1 var(--font-body);
    -webkit-tap-highlight-color: transparent;
  }
  .mobile-nav-link[aria-current="page"] { color: var(--forest); }
  .mobile-nav-icon { display: grid; place-items: center; width: 30px; height: 25px; }
  .mobile-nav-link--scan { color: var(--forest); font-weight: 800; }
  .mobile-nav-link--scan .mobile-nav-icon {
    width: 36px;
    height: 30px;
    border-radius: 10px;
    background: var(--tint);
    color: var(--forest);
  }
  .mobile-nav-link--scan[aria-current="page"] .mobile-nav-icon { background: var(--forest); color: #fff; }
  .mobile-nav-link:focus-visible { outline: 3px solid var(--leaf); outline-offset: -2px; border-radius: 10px; }
}

@media (prefers-reduced-motion: reduce) {
  .notification-button, .avatar, .assistant-toggle, .assistant-toggle img, .assistant-toggle-state { transition: none; }
}
</style>
