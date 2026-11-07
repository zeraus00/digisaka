// Renders a screen to HTML on the server renderer, with the active Pinia and a memory router; no DOM needed.
// onMounted does not run there, so a test loads its store first and the markup shows that state.
import { createSSRApp } from 'vue';
import { renderToString } from 'vue/server-renderer';
import { createRouter, createMemoryHistory } from 'vue-router';
import { getActivePinia } from 'pinia';

export async function renderScreen(view, route, path) {
  const router = createRouter({ history: createMemoryHistory(), routes: [{ path: route, component: view }, { path: '/:rest(.*)*', component: { render: () => null } }] });
  const app = createSSRApp(view);
  app.use(getActivePinia()).use(router);
  router.push(path);
  await router.isReady();
  return renderToString(app);
}
