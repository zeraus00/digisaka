export const ASSISTANT_QUICK_PROMPTS = [
  'What should I check next?',
  'What does human review mean?',
  'How do I scan a leaf?',
];

export const ASSISTANT_STARTER_MESSAGE = {
  id: 'toka-welcome',
  role: 'assistant',
  text: 'Hi! I’m Toka. I can help you find your way around scans, line suggestions, and treatment schedules.',
};

const REPLIES = [
  {
    match: /\b(next|check|start|farm|suggestion)\b/i,
    text: 'In this demo, Line L03 has a treatment suggestion for 2026-W24. Review the suggestion and its details before recording any application.',
    card: { title: 'Suggested next step', detail: 'Review Line L03 · 2026-W24', action: { label: 'View suggestion', to: '/treatment/L03/2026-W24' } },
  },
  {
    match: /\b(review|human|expert|uncertain)\b/i,
    text: 'Human review means the available information was not enough for the rules to make a clear assessment. Check the line history and missing readings; don’t treat a suggestion as an approval.',
    card: { title: 'Demo example', detail: 'Line L05 needs human review for 2026-W24.', action: { label: 'Open diagnosis history', to: '/history' } },
  },
  {
    match: /\b(scan|photo|leaf|camera|image)\b/i,
    text: 'Open Disease Detection, choose a line and week, then add clear photos of banana leaves. Review the results and confirm the symptoms when prompted.',
    card: { title: 'Ready to scan?', detail: 'Use a clear photo with the leaf visible and well lit.', action: { label: 'Open Disease Detection', to: '/scan' } },
  },
  {
    match: /\b(schedule|calendar|treatment|application|spray)\b/i,
    text: 'Your Treatment Schedule shows the current line plans and recorded applications. Suggestions are guidance to review, not automatic approvals.',
    card: { title: 'Demo schedule', detail: 'Line L02 has a recorded application in its history.', action: { label: 'Open Treatment Schedule', to: '/schedule' } },
  },
  {
    match: /\b(sigatoka|disease|symptom|spots|fungus)\b/i,
    text: 'Black Sigatoka is a banana leaf disease. Look for changes on the leaf and use the scan flow to record an assessment. A photo-based result is only a guide and may need human review.',
  },
];

export function stubReplyFor(text) {
  const reply = REPLIES.find((item) => item.match.test(text));
  if (reply) return { text: reply.text, ...(reply.card ? { card: structuredClone(reply.card) } : {}) };
  return {
    text: 'I’m a demo assistant, so I can only answer a few common questions with sample information. Try asking about the next step, human review, scanning a leaf, or the treatment schedule.',
  };
}
