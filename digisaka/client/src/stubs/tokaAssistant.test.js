import { describe, expect, it } from 'vitest';
import { ASSISTANT_QUICK_PROMPTS, stubReplyFor } from './tokaAssistant.js';

describe('Toka assistant demo replies', () => {
  it('offers useful starter prompts', () => {
    expect(ASSISTANT_QUICK_PROMPTS).toHaveLength(3);
  });

  it.each([
    ['What should I do next?', '/treatment/L03/2026-W24'],
    ['What does human review mean?', '/history'],
    ['How do I scan a leaf?', '/scan'],
    ['How do I find my schedule?', '/schedule'],
  ])('returns a canned sample reply for %s', (prompt, path) => {
    expect(stubReplyFor(prompt).card.action.to).toBe(path);
  });

  it('does not pretend to be a live AI for unsupported questions', () => {
    expect(stubReplyFor('Can you tell me something else?').text).toContain('demo assistant');
  });
});
