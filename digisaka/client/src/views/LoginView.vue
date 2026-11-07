<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.js';
import { landingFor, safeNext } from '../routeGuard.js';

const router = useRouter(), route = useRoute(), auth = useAuthStore();
const busy = ref(false), error = ref('');
const f = ref({ email: '', password: '' });
const showPassword = ref(false);

// Entrance animation state
const reveal = ref({ logo: false, heading: false, form: false, button: false });

async function submit() {
  busy.value = true; error.value = '';
  try {
    await auth.signIn(f.value.email, f.value.password);
    router.push(safeNext(route.query.next) ?? landingFor(auth));
  } catch (e) { error.value = e.message; }
  finally { busy.value = false; }
}

function togglePassword() {
  showPassword.value = !showPassword.value;
}

// Staggered entrance animation
onMounted(() => {
  const steps = [
    { key: 'logo', delay: 0 },
    { key: 'heading', delay: 100 },
    { key: 'form', delay: 200 },
    { key: 'button', delay: 300 },
  ];
  steps.forEach(({ key, delay }) => {
    setTimeout(() => { reveal.value[key] = true; }, delay);
  });
});
</script>

<template>
  <div class="login-page">
    <!-- LEFT PANEL - Promotional Background -->
    <section class="left-panel" aria-hidden="true">
      <div class="left-content" :class="{ 'is-visible': reveal.logo }">
        <div class="logo-container">
          <div class="logo-box">
            <img src="../assets/bananaleaf1.png" alt="" aria-hidden="true">
          </div>
          <span class="brand-text">Toka AI</span>
        </div>
      </div>

      <div class="left-content promo-wrapper" :class="{ 'is-visible': reveal.heading }">
        <div class="promo-block">
          <h2 class="promo-heading">
            Catch Black Sigatoka<br>
            before it spreads
          </h2>
          <p class="promo-description">
            Scan banana leaves, assess them in<br>
            bulk, and schedule treatment while it<br>
            still works.
          </p>
        </div>
      </div>

      <div class="left-content footer-area" :class="{ 'is-visible': reveal.logo }">
        <p class="footer-text">
          Leads Agricultural Products Corporation
        </p>
      </div>
    </section>

    <section class="mobile-hero" aria-hidden="true">
      <div class="mobile-hero-mark">
        <img src="../assets/bananaleaf-no-border.png" alt="">
      </div>
      <div class="mobile-hero-copy">
        <h1>Toka AI</h1>
        <p>Healthy leaves. Better harvests.</p>
      </div>
    </section>

    <!-- RIGHT PANEL - Login Form -->
    <section class="right-panel">
      <form class="login-card" novalidate @submit.prevent="submit">
        <div class="form-wrapper" :class="{ 'is-visible': reveal.form }">
          <h1 class="login-heading" :class="{ 'is-visible': reveal.heading }">
            <span class="desktop-heading">Sign In</span>
            <span class="mobile-heading">Sign In</span>
          </h1>
          <p class="login-subtitle" :class="{ 'is-visible': reveal.heading }">
            <span class="desktop-subtitle">Use your Toka AI account.</span>
            <span class="mobile-subtitle">Sign in to keep your farm on track.</span>
          </p>

          <div class="form-group">
            <label class="form-label" for="email">Email</label>
            <div class="input-wrapper">
              <input
                type="email"
                id="email"
                v-model="f.email"
                class="form-input"
                placeholder="Email"
                autocomplete="email"
                required
                :disabled="busy"
              >
            </div>
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <div class="input-wrapper">
              <input
                :type="showPassword ? 'text' : 'password'"
                id="password"
                v-model="f.password"
                class="form-input password-input"
                placeholder="Password"
                autocomplete="current-password"
                required
                :disabled="busy"
              >
              <button
                type="button"
                class="toggle-password"
                @click="togglePassword"
                :aria-label="showPassword ? 'Hide password' : 'Show password'"
                :aria-pressed="showPassword"
                :disabled="busy"
              >
                <svg viewBox="0 0 24 24" aria-hidden="true" v-if="!showPassword">
                  <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12Z"/>
                  <circle cx="12" cy="12" r="3.2"/>
                </svg>
                <svg viewBox="0 0 24 24" aria-hidden="true" v-else>
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>
          </div>

          <div class="err" role="alert" v-if="error">{{ error }}</div>

          <button class="signin-button" type="submit" :disabled="busy" :class="{ 'is-visible': reveal.button }">
            <span v-if="busy">Signing in…</span>
            <span v-else>Sign In</span>
          </button>
        </div>
      </form>
    </section>
  </div>
</template>

<style scoped>
.login-page {
  color: var(--ink);
  background: #F3F4F6;
  min-height: 100vh;
  min-height: 100dvh;
  display: grid;
  grid-template-columns: 39.31% 1fr;
}

/* ENTRANCE ANIMATIONS */
.left-content,
.form-wrapper {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.left-content.is-visible,
.form-wrapper.is-visible {
  opacity: 1;
  transform: translateY(0);
}

/* Children of form-wrapper animate in when parent is visible */
.form-wrapper .login-heading,
.form-wrapper .login-subtitle,
.form-wrapper .form-group,
.form-wrapper .err,
.form-wrapper .signin-button {
  opacity: 0;
  transform: translateY(20px);
  transition: opacity 0.5s ease, transform 0.5s ease;
}

.form-wrapper.is-visible .login-heading,
.form-wrapper.is-visible .login-subtitle,
.form-wrapper.is-visible .form-group,
.form-wrapper.is-visible .err,
.form-wrapper.is-visible .signin-button {
  opacity: 1;
  transform: translateY(0);
}

/* Stagger delays for form children */
.form-wrapper.is-visible .login-heading { transition-delay: 0ms; }
.form-wrapper.is-visible .login-subtitle { transition-delay: 50ms; }
.form-wrapper.is-visible .form-group:nth-of-type(1) { transition-delay: 100ms; }
.form-wrapper.is-visible .form-group:nth-of-type(2) { transition-delay: 150ms; }
.form-wrapper.is-visible .err { transition-delay: 250ms; }
.form-wrapper.is-visible .signin-button { transition-delay: 300ms; }

@media (prefers-reduced-motion: reduce) {
  .left-content,
  .form-wrapper,
  .form-wrapper .login-heading,
  .form-wrapper .login-subtitle,
  .form-wrapper .form-group,
  .form-wrapper .err,
  .form-wrapper .signin-button {
    opacity: 1;
    transform: none;
    transition: none;
  }
}

/* LEFT PANEL */
.left-panel {
  min-height: 100vh;
  min-height: 100dvh;
  background-image:
    linear-gradient(
      180deg,
      rgba(227, 255, 241, 0.72) 0%,
      rgba(27, 151, 90, 0.72) 33%,
      rgba(5, 96, 52, 0.72) 66%,
      rgba(18, 63, 41, 0.72) 100%
    ),
    url("../assets/blacksigatoka.png");
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px 48px;
  box-sizing: border-box;
}

.left-content {
  width: 100%;
}

.promo-wrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding-bottom: 40px; /* space above footer */
}

.logo-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.logo-box {
  width: 44px;
  height: 44px;
  border: 1px solid #007A48;
  border-radius: 10px;
  overflow: hidden;
  flex-shrink: 0;
}

.logo-box img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.brand-text {
  font-size: 24px;
  font-weight: 700;
  color: #006D43;
  line-height: 1;
  white-space: nowrap;
}

.promo-block {
  text-align: left;
}

.promo-heading {
  font-size: 36px;
  font-weight: 700;
  line-height: 44px;
  color: #8CFF91;
  margin: 0;
}

.promo-description {
  font-size: 20px;
  font-weight: 400;
  line-height: 28px;
  color: #F2F2F2;
  margin: 24px 0 0 0;
}

.footer-area {
  margin-top: auto;
}

.footer-text {
  font-size: 16px;
  font-weight: 400;
  color: #9AA5A4;
  margin: 0;
}

.mobile-hero,
.mobile-heading,
.mobile-subtitle {
  display: none;
}

/* RIGHT PANEL */
.right-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
  min-height: 100vh;
  min-height: 100dvh;
}

.login-card {
  width: 100%;
  max-width: 483px;
  background: #FFFFFF;
  border: 1px solid #9CA3AF;
  border-radius: 12px;
  padding: 48px 72px;
  box-sizing: border-box;
}

.form-wrapper {
  width: 100%;
}

.login-heading {
  font-size: 36px;
  font-weight: 700;
  line-height: 43px;
  color: #1C1C1C;
  margin-bottom: 6px;
}

.login-subtitle {
  font-size: 18px;
  font-weight: 400;
  color: #98A2B3;
  margin-bottom: 36px;
}

.form-group {
  margin-bottom: 24px;
}

.form-label {
  display: block;
  font-size: 16px;
  font-weight: 400;
  color: #667085;
  margin-bottom: 8px;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.form-input {
  width: 100%;
  height: 45px;
  padding: 0 20px;
  border: 1px solid var(--line);
  border-radius: 11px;
  background: #FFFFFF;
  font-size: 14px;
  color: #1C1C1C;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.form-input:focus {
  border-color: var(--leaf);
  box-shadow: 0 0 0 3px rgba(10, 159, 85, 0.15);
}

.form-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.form-input::placeholder {
  color: #98A2B3;
}

.password-input {
  padding-right: 52px;
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 20px;
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
}

.toggle-password:focus-visible {
  outline: 2px solid var(--leaf);
  outline-offset: 2px;
}

.toggle-password:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toggle-password svg {
  width: 20px;
  height: 20px;
  stroke: #666666;
  fill: none;
}

.err {
  color: var(--danger);
  font-weight: 700;
  font-size: 14px;
  margin-bottom: 16px;
  min-height: 1.3em;
}

.signin-button {
  width: 100%;
  height: 52px;
  background: #006F47;
  border: none;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 700;
  color: #FFFFFF;
  cursor: pointer;
  transition: background-color 0.15s ease, transform 0.1s ease;
}

.signin-button:hover:not(:disabled) {
  background: #005A3A;
}

.signin-button:active:not(:disabled) {
  background: #004D30;
  transform: scale(0.98);
}

.signin-button:disabled {
  opacity: 0.6;
  cursor: wait;
}

.signin-button:focus-visible {
  outline: 3px solid #006F47;
  outline-offset: 2px;
}

/* RESPONSIVE DESIGN */
@media (max-width: 1439px) {
  .login-page {
    grid-template-columns: 39.31% 1fr;
  }
  .left-panel {
    padding: 32px 40px;
  }
  .login-card {
    padding: 40px 48px;
  }
  .promo-heading {
    font-size: 32px;
    line-height: 40px;
  }
  .promo-description {
    font-size: 18px;
    line-height: 26px;
  }
}

@media (max-width: 1024px) {
  .login-page {
    grid-template-columns: 1fr;
  }
  .left-panel {
    display: none;
  }
  .mobile-hero {
    display: block;
    position: relative;
    width: 100%;
    max-width: 820px;
    height: clamp(400px, 58vh, 520px);
    margin: 0 auto;
    overflow: hidden;
    color: #fff;
    text-align: center;
    background: linear-gradient(135deg, #2fa354 0%, #1f7a3d 55%, #175a2d 100%);
    border-radius: 0 0 40px 40px;
  }
  .mobile-hero::before,
  .mobile-hero::after {
    content: "";
    position: absolute;
    border-radius: 100% 0 100% 0;
    background: rgba(255, 255, 255, .09);
    pointer-events: none;
  }
  .mobile-hero::before {
    width: 300px;
    height: 130px;
    right: -72px;
    top: 22px;
    transform: rotate(-35deg);
  }
  .mobile-hero::after {
    width: 270px;
    height: 124px;
    left: -126px;
    top: 58%;
    transform: rotate(35deg);
  }
  .mobile-hero-mark {
    position: absolute;
    top: clamp(84px, 12vh, 108px);
    left: 50%;
    display: grid;
    width: 92px;
    height: 92px;
    place-items: center;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, .75);
    border-radius: 50%;
    background: #fff;
    transform: translateX(-50%);
  }
  .mobile-hero-mark img {
    width: 58px;
    height: 58px;
    object-fit: cover;
  }
  .mobile-hero-copy {
    position: absolute;
    top: clamp(190px, 25vh, 228px);
    right: 24px;
    left: 24px;
  }
  .mobile-hero-copy h1 {
    margin: 0;
    color: #fff;
    font-size: 44px;
    font-weight: 700;
    line-height: 1.2;
  }
  .mobile-hero-copy p {
    margin: 8px 0 0;
    font-size: 17px;
    opacity: .92;
  }
  .right-panel {
    position: relative;
    z-index: 1;
    width: 100%;
    max-width: 820px;
    min-height: 0;
    margin: -112px auto 0;
    padding: 0 24px 48px;
  }
  .login-card {
    width: 100%;
    max-width: 480px;
    padding: 36px 40px 32px;
    border: 1px solid #9ca3af;
    border-radius: 16px;
    box-shadow: 0 6px 20px rgba(20, 57, 31, .1);
  }
  .desktop-heading,
  .desktop-subtitle {
    display: none;
  }
  .mobile-heading,
  .mobile-subtitle {
    display: inline;
  }
  .login-heading {
    margin: 0;
    color: #14391f;
    font-size: 30px;
    line-height: 1.3;
  }
  .login-subtitle {
    margin: 6px 0 24px;
    color: #5b645e;
    font-size: 16px;
  }
  .form-label {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .form-group { margin-bottom: 14px; }
  .input-wrapper {
    height: 56px;
    padding: 0 16px;
    border: 1px solid #cbd0d5;
    border-radius: 10px;
    background: #fff;
  }
  .input-wrapper:focus-within {
    border-color: #35a95b;
    box-shadow: 0 0 0 3px rgba(53, 169, 91, .18);
  }
  .form-input {
    height: 100%;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    font-size: 16px;
    color: #14391f;
  }
  .form-input:focus {
    border: 0;
    box-shadow: none;
  }
  .form-input::placeholder { color: #8a978d; }
  .password-input { padding-right: 36px; }
  .toggle-password { right: 0; width: 30px; height: 30px; }
  .toggle-password svg { stroke: #6f8f78; }
  .signin-button {
    height: 56px;
    margin-top: 2px;
    background: #08783f;
    box-shadow: none;
    font-size: 18px;
  }
  .signin-button:hover:not(:disabled) { background: #06552c; }
}

@media (max-width: 767px) {
  .login-page {
    display: block;
    min-height: 100vh;
    min-height: 100dvh;
    background: #f6f5f0;
  }
  .mobile-hero {
    height: 307px;
    max-width: none;
    border-radius: 0 0 30px 30px;
  }
  .mobile-hero::before { width: 176px; height: 76px; right: -40px; top: 18px; }
  .mobile-hero::after { width: 160px; height: 74px; left: -80px; top: 208px; }
  .mobile-hero-mark { top: 82px; width: 68px; height: 68px; }
  .mobile-hero-mark img { width: 42px; height: 42px; }
  .mobile-hero-copy { top: 158px; right: 16px; left: 16px; }
  .mobile-hero-copy h1 { font-size: 32px; }
  .mobile-hero-copy p { margin-top: 6px; font-size: 14px; }
  .right-panel {
    align-items: flex-start;
    max-width: 430px;
    margin-top: -27px;
    padding: 0 16px 32px;
  }
  .login-card {
    width: 100%;
    max-width: none;
    padding: 28px 24px 24px;
    border: 1px solid #9ca3af;
    border-radius: 16px;
    box-shadow: 0 4px 14px rgba(20, 57, 31, .08);
  }
  .login-heading {
    font-size: 24px;
    line-height: 1.3;
  }
  .login-subtitle {
    margin: 4px 0 18px;
    font-size: 14px;
  }
  .form-group { margin-bottom: 12px; }
  .input-wrapper { height: 52px; }
  .form-input {
    height: 100%;
    padding: 0;
  }
  .password-input { padding-right: 34px; }
  .toggle-password { width: 28px; height: 28px; border-radius: 50%; }
  .remember-me { margin: 20px 0 28px; }
  .signin-button { height: 52px; }
  .err { margin-bottom: 12px; }
}

@media (min-width: 768px) and (max-width: 1024px) {
  .login-page {
    display: block;
    min-height: 100vh;
    min-height: 100dvh;
    background: #f6f5f0;
  }
  .right-panel { margin-top: -112px; }
}

@media (max-width: 767px) and (max-height: 700px) {
  .mobile-hero { height: 260px; }
  .mobile-hero-mark { top: 58px; }
  .mobile-hero-copy { top: 134px; }
}

@media (max-width: 359px) {
  .login-card {
    padding-right: 20px;
    padding-left: 20px;
  }
}

@media (max-height: 700px) {
  .promo-description {
    display: none;
  }
}
</style>