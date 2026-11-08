import { beforeEach, describe, expect, it } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTokaAssistantStore } from './tokaAssistant.js';

beforeEach(() => setActivePinia(createPinia()));

describe('Toka assistant store', () => {
  it('can enable and disable the assistant', () => {
    const store = useTokaAssistantStore();
    expect(store.enabled).toBe(true);
    store.toggleEnabled();
    expect(store.enabled).toBe(false);
    store.toggleEnabled();
    expect(store.enabled).toBe(true);
  });

  it('remembers the route to return to after closing the assistant', () => {
    const store = useTokaAssistantStore();
    store.setReturnPath('/history?line=L01');
    expect(store.returnPath).toBe('/history?line=L01');
  });

  it('starts with the demo greeting and appends the user prompt and a canned response', () => {
    const store = useTokaAssistantStore();
    store.send('How do I scan a leaf?');
    expect(store.messages.map(({ role }) => role)).toEqual(['assistant', 'user', 'assistant']);
    expect(store.messages.at(-1)).toMatchObject({ card: { action: { to: '/scan' } } });
  });

  it('ignores blank messages and can restart the demo conversation', () => {
    const store = useTokaAssistantStore();
    store.send('   ');
    expect(store.messages).toHaveLength(1);
    store.send('Show me my schedule');
    store.reset();
    expect(store.messages).toHaveLength(1);
    expect(store.messages[0].id).toBe('toka-welcome');
  });
});
