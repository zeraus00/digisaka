// What the Results step says about the line's suggestion once the scans are in.
// `reschedule` is the run a verified scan started (null: the line stage is unchanged); `tracked` is how following it ended (ready, unchanged, failed, timeout or error).
export function updateState({ reschedule, tracked, updating }) {
  if (!reschedule) return 'unchanged';
  if (updating || !tracked) return 'updating';
  return tracked; // ready, failed, timeout or error
}

// The suggestion is current when it is read, no run is updating it, and the update ended ready or unchanged.
export const isCurrent = ({ phase, updating, state }) => phase === 'ready' && !updating && (state === 'ready' || state === 'unchanged');
// A monitoring or review outcome has no fungicide step to open.
export const hasFungicides = (suggestion) => !suggestion?.outcome;
