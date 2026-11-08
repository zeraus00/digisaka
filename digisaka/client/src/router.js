import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from './stores/auth.js';
import { useTokaAssistantStore } from './stores/tokaAssistant.js';
import { redirectFor } from './routeGuard.js';

const routes = [
  { path: '/login', component: () => import('./views/LoginView.vue'), meta: { guest: true } },
  {
    path: '/', component: () => import('./components/AppLayout.vue'), meta: { auth: true },
    children: [
      { path: '', component: () => import('./views/DashboardView.vue'), meta: { title: 'Dashboard' } },
      { path: 'scan', component: () => import('./views/ScanView.vue'), meta: { title: 'Disease Detection' } },
      { path: 'history', component: () => import('./views/HistoryView.vue'), meta: { title: 'Diagnosis History' } },
      { path: 'schedule', component: () => import('./views/ScheduleListView.vue'), meta: { title: 'Treatment Schedule' } },
      { path: 'profile', component: () => import('./views/ProfileView.vue'), meta: { title: 'My Profile' } },
      { path: 'more', component: () => import('./views/MoreView.vue'), meta: { title: 'More' } },
      { path: 'assistant', component: () => import('./views/DashboardView.vue'), meta: { title: 'Toka AI Assistant' } },
      { path: 'treatment/:lineId/:week', component: () => import('./views/TreatmentDetailView.vue'), meta: { title: 'Treatment' } },
      { path: 'schedule/:lineId', component: () => import('./views/ScheduleLineView.vue'), meta: { title: 'Treatment Schedule' } },
    ],
  },
  {
    path: '/admin', component: () => import('./admin/AdminLayout.vue'), meta: { auth: true, admin: true },
    children: [
      { path: '', component: () => import('./admin/OverviewView.vue') },
      { path: 'users', component: () => import('./admin/UsersView.vue') },
      { path: 'datasets', component: () => import('./admin/DatasetsView.vue') },
      { path: 'extractions', component: () => import('./admin/ExtractionsView.vue') },
      { path: 'workflows/:id', component: () => import('./admin/WorkflowView.vue') },
      { path: 'tracing', component: () => import('./admin/NotAvailableView.vue'), props: { title: 'Tracing' } },
      { path: 'history', component: () => import('./admin/AuditView.vue') },
      { path: 'kg', component: () => import('./admin/NotAvailableView.vue'), props: { title: 'Knowledge Graph' } },
      { path: 'ontology', component: () => import('./admin/OntologyView.vue') },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({ history: createWebHistory(), routes });
router.beforeEach((to, from) => {
  const tokaAssistant = useTokaAssistantStore();
  if (to.path === '/assistant') {
    const authRedirect = redirectFor(to, useAuthStore());
    if (authRedirect) return authRedirect;
    if (!tokaAssistant.enabled) return from.meta.auth ? from.fullPath : '/';
    tokaAssistant.openExpanded();
    return from.meta.auth && from.path !== '/assistant' ? from.fullPath : '/';
  }
  return redirectFor(to, useAuthStore());
});

export default router;
