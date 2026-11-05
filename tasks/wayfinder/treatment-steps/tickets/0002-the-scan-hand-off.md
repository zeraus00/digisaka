---
id: "0002"
title: "The scan hand-off"
map: treatment-steps
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: ["0001"]
---

Rank: standard (client only)

## Question

When a verified scan hands off to the steps, what happens to the scan's in-flight suggestion update, and how does the Practitioner get back to the scan results?

- **The update:** today `ScanView` stops it on unmount (`stopUpdate` in `onBeforeUnmount`) and `TreatmentDetailView` calls `store.stop()` on its own unmount. The Spray log step shows `SuggestionUpdate` with the scan's `reschedule`. Options: the steps read `scan.reschedule` from the scan store when its line and week match the route and keep following it; or `/treatment` just reloads the suggestion and shows "Updating…" from the store. Check in code which one keeps a run that is still going visible without a second start.
- **Back to scan results:** `ScanView` keeps its `step` in a local `ref`, so a return to `/scan` starts at step 1. Options: move `step` into the scan store so a "Back to scan results" link returns to Results; or show no such link (browser back and the Scan nav item remain).

If 0001 keeps two homes, this ticket shrinks to the second bullet or is ruled out.

## Resolution

Rank standard (client only, no API change); both questions self-decided on the recommendation (2026-11-05).

Facts from the code: Scan step 3's "Continue to weather risk" is enabled while the update is still running, so a hand-off mid-run is real. On a route change Vue unmounts `ScanView` (its `stopUpdate`: `cycle.reset()`, `suggestion.stop()`, `tracked = ''`) before `/treatment` mounts. `suggestion.track(line, cycleId)` only polls; it never starts a run. `suggestion.load` follows the served `running` flag but cannot tell updated from unchanged, failed or timed out. The scan store keeps the leaves (and their `reschedule`) across routes; `ScanView` keeps its `step` in a local `ref`, so a return to `/scan` opens step 1 with the leaves still queued.

- **The update: `/treatment` picks up the scan's run.** On mount, when the scan store's `line` and `week` match the route and `scan.reschedule` is set, `/treatment` calls `suggestion.track(line, reschedule.cycle_id)`; otherwise `suggestion.load(line)`. `ScanView` stays as it is: its stop on unmount is harmless, because `/treatment` starts following again right after. No second run is started (track only polls). Principle: separation of concerns (the served run decides updated, unchanged or failed; the client does not guess from `running`).
- **Spray log shows the update only for a scan entry.** `SuggestionUpdate` sits on the Spray log tab with the scan's `reschedule` and `:show-done="false"`: it shows while updating, on failure (Retry) and on timeout (Check again), and nothing once done. Without a matching scan it is not mounted, so a Dashboard entry never sees "These scans did not change it". The "Continue to fungicide options" button sits outside it, like the other tabs' buttons. An old scan of the same line-week finds its run done at once and shows nothing.
- **Back to scan results: keep it, by moving `step` into the scan store.** `ScanView` reads and writes `scan.step` instead of its local `ref`. `/treatment` shows a "Back to scan results" link above the line header when the scan store's `line` and `week` match the route and the scan has reached Results; it goes to `/scan`, as browser back does, and both land on Results. Principle: least surprise; the journey's "Back to results" is not lost.
- **Build notes:** `ScanView`'s `watch(step)` starts tracking only on a change into step 3, so a return to `/scan` at step 3 with a run still going must track again on mount (`/treatment` stops the store on unmount). `scan.select` (new line or week) and "New scan" reset `scan.step` to 1.
- No glossary change.
