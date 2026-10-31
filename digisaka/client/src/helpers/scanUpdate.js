// What the Results step says about the line's suggestion once the scans are in.
// `reschedule` is the run a verified scan started (null: the line stage is unchanged); `tracked` is how following it ended.
export function updateState({ reschedule, tracked, updating }) {
  if (!reschedule) return 'unchanged';
  if (updating || !tracked) return 'updating';
  return tracked; // ready, failed, timeout or error
}
