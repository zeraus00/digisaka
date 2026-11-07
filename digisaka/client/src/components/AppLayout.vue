<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter, RouterLink, RouterView } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { useDevClockStore } from '../stores/devClock.js';
import Icon from './Icon.vue';
import DevDateBar from './DevDateBar.vue';
import { useAccountMenu } from './useAccountMenu.js';

const scroller = ref(null);
const route = useRoute(), router = useRouter(), auth = useAuthStore();
const title = computed(() => route.meta.title || 'Digisaka');
const sidebarOpen = ref(false);

const MENU = [
  { to: '/', label: 'Dashboard', icon: 'home' },
  { to: '/scan', label: 'Disease Detection', icon: 'scan' },
  { to: '/history', label: 'Diagnosis History', icon: 'history' },
  { to: '/schedule', label: 'Treatment Schedule', icon: 'calendar' },
];

onMounted(() => useDevClockStore().load());

const { menuOpen, narrow, account, avatar, toggleMenu, closeMenu } = useAccountMenu(route);
function signOut() { closeMenu(); auth.signOut(); router.push('/login'); }
watch(() => route.path, () => { if (narrow.value) sidebarOpen.value = false; });
</script>

<template>
  <div class="shell">
    <div
      v-if="narrow"
      class="sidebar-backdrop"
      :class="{ 'sidebar-backdrop--visible': sidebarOpen }"
      aria-hidden="true"
      @click="sidebarOpen = false"
    ></div>

    <aside
      id="user-sidebar"
      class="sidebar"
      :class="{ 'sidebar--open': sidebarOpen, 'sidebar--narrow': narrow }"
      aria-label="User navigation"
    >
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

      <button type="button" class="sidebar-signout" @click="signOut">Sign Out</button>
    </aside>

    <div class="main">
      <header class="topbar">
        <button
          v-if="narrow"
          type="button"
          class="topbar-hamburger"
          aria-label="Open navigation"
          :aria-expanded="sidebarOpen"
          aria-controls="user-sidebar"
          @click="sidebarOpen = true"
        >
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <div class="where"><span class="mark small"><img src="../assets/bananaleaf2.png" alt="" aria-hidden="true"></span><h2>{{ title }}</h2></div>
        <div class="tools">
          <RouterLink to="/scan" class="pill"><Icon name="scan" :size="15" />New Scan</RouterLink>
          <div ref="account" class="account">
            <button ref="avatar" type="button" class="avatar" :title="auth.email" aria-label="Account" :tabindex="narrow ? 0 : -1"
                    :aria-expanded="narrow ? menuOpen : undefined" :aria-controls="narrow ? 'account-menu' : undefined" @click="toggleMenu">{{ auth.initials }}</button>
            <div v-if="menuOpen" id="account-menu" class="menu">
              <p class="menu-who">{{ auth.email }}</p>
              <button type="button" class="menu-out" @click="signOut"><Icon name="logout" :size="18" /><span>Sign out</span></button>
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
    <DevDateBar />
  </div>
</template>

<style scoped>
.shell { display: grid; grid-template-columns: var(--sidebar-w) minmax(0, 1fr); height: 100dvh; min-height: 100vh; }
.sidebar { position: relative; width: var(--sidebar-w); height: 100dvh; overflow: hidden; background: #056b43; color: #fff; z-index: 20; }
.leaf-deco { position: absolute; z-index: 0; pointer-events: none; }
.leaf-deco--1 { top: 0; right: -10px; width: 80px; height: 120px; }
.leaf-deco--2 { top: 62%; left: -20px; width: 150px; height: 130px; }
.leaf-deco--3 { bottom: -24px; left: 100px; width: 160px; height: 170px; }
.sidebar-brand { position: absolute; top: 22px; left: 24px; z-index: 1; display: flex; align-items: center; gap: 12px; font: 800 24px var(--font-display); letter-spacing: -.3px; }
.sidebar-mark { display: grid; place-items: center; width: 40px; height: 43px; flex: none; }
.sidebar-mark img { display: block; width: 40px; height: 40px; object-fit: contain; }
.sidebar-title { white-space: nowrap; }
.sidebar-section { position: absolute; top: 97px; left: 24px; z-index: 1; color: rgba(255, 255, 255, .7); font: 700 12px/14px var(--font-display); }
.sidebar-nav { position: absolute; top: 128px; left: 24px; z-index: 1; width: calc(100% - 48px); }
.sidebar-list { display: flex; flex-direction: column; gap: 4px; }
.sidebar-link { display: flex; align-items: center; gap: 14px; width: 100%; height: 48px; padding: 0 10px 0 12px; border: 0; border-radius: 8px; background: transparent; color: #fff; font: 600 15px var(--font-body); text-align: left; cursor: pointer; transition: background .15s ease; }
.sidebar-link:hover:not(.sidebar-link--active) { background: rgba(0, 0, 0, .12); }
.sidebar-link:focus-visible, .sidebar-signout:focus-visible { outline: 3px solid var(--leaf-soft); outline-offset: 2px; }
.sidebar-link--active { background: #04583a; color: #fff; }
.sidebar-link .icon { width: 18px; height: 18px; flex: none; }
.sidebar-label { overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.sidebar-admin-icon { display: grid; place-items: center; width: 18px; height: 18px; flex: none; font-size: 20px; line-height: 1; }
.sidebar-signout { position: absolute; bottom: 24px; left: 24px; z-index: 1; width: calc(100% - 48px); height: 52px; border: 0; border-radius: 8px; background: #fff; color: #056b43; font: 800 15px var(--font-body); cursor: pointer; transition: background .15s ease, transform .15s ease, box-shadow .2s ease; }
.sidebar-signout:hover { background: #f3f4f6; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(5, 107, 67, .2); }
.sidebar-signout:active { transform: scale(.98); }
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
.avatar { position: relative; display: grid; place-items: center; width: 40px; height: 40px; border: 0; border-radius: 50%; background: var(--leaf); color: #fff; font: 800 14px var(--font-display); }
.account { position: relative; }
.menu { display: none; }
.menu-who { overflow: hidden; padding: 8px 12px; color: var(--ink-soft); font-size: 13px; text-overflow: ellipsis; white-space: nowrap; }
.menu-out { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; border: 0; border-radius: 10px; background: none; color: var(--forest); font: 800 15px var(--font-body); }
.menu-out:hover { background: var(--tint); }
.content { flex: 1; min-height: 0; overflow-y: auto; }
.sidebar-backdrop, .topbar-hamburger { display: none; }

@media (max-width: 900px) {
  .shell { grid-template-columns: minmax(0, 1fr); grid-template-rows: 1fr; }
  .sidebar.sidebar--narrow { position: fixed; inset: 0 auto 0 0; z-index: 50; display: flex; flex-direction: column; width: min(320px, 100vw); height: 100dvh; padding: 0 0 16px; box-shadow: 4px 0 24px rgba(5, 107, 67, .2); transform: translateX(-105%); transition: transform .25s ease; overflow: hidden; }
  .sidebar.sidebar--narrow.sidebar--open { transform: translateX(0); }
  .sidebar.sidebar--narrow .sidebar-brand, .sidebar.sidebar--narrow .sidebar-section, .sidebar.sidebar--narrow .sidebar-nav, .sidebar.sidebar--narrow .sidebar-signout { position: static; }
  .sidebar.sidebar--narrow .sidebar-brand { margin: 22px 24px 24px; }
  .sidebar.sidebar--narrow .sidebar-section { margin: 0 24px 8px; }
  .sidebar.sidebar--narrow .sidebar-nav { width: auto; margin: 0 24px; }
  .sidebar.sidebar--narrow .sidebar-list { gap: 2px; }
  .sidebar.sidebar--narrow .sidebar-link { height: 46px; padding: 0 12px; }
  .sidebar.sidebar--narrow .sidebar-signout { width: calc(100% - 48px); margin: auto 24px 0; flex: none; }
  .sidebar-backdrop { display: block; position: fixed; inset: 0; z-index: 40; background: rgba(5, 107, 67, .4); opacity: 0; visibility: hidden; transition: opacity .2s ease, visibility .2s ease; }
  .sidebar-backdrop--visible { opacity: 1; visibility: visible; }
  .main { height: 100dvh; }
  .topbar { height: 72px; min-height: 72px; }
  .topbar-hamburger { display: grid; place-items: center; width: 40px; height: 40px; margin-right: auto; border: 0; border-radius: 10px; background: transparent; color: #056b43; cursor: pointer; }
  .topbar-hamburger:hover { background: #f3f4f6; }
  .topbar-hamburger:focus-visible { outline: 3px solid var(--leaf); outline-offset: 2px; }
  .where h2, .pill { display: none; }
  .avatar { cursor: pointer; }
  .menu { display: block; position: absolute; top: calc(100% + 8px); right: 0; z-index: 40; min-width: 200px; max-width: calc(100vw - 2 * var(--gutter)); padding: 6px; border: 1px solid var(--line); border-radius: 14px; background: #fff; box-shadow: 0 8px 24px rgba(6, 40, 20, .18); }
  .tools { gap: 8px; }
}

@media (prefers-reduced-motion: reduce) {
  .sidebar, .sidebar-backdrop, .sidebar-signout { transition: none; }
}
</style>
