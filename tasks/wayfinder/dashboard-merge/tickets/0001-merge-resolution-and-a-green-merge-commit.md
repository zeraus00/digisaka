---
id: "0001"
title: "Merge resolution and a green merge commit"
map: dashboard-merge
labels: [wayfinder:task]
status: closed
assignee: "archelaus"
blocked_by: []
---

**Model:** Sonnet. AFK: a trial merge in a throwaway worktree, then a per-file call against settled rules.

## Question

How does each conflict in `git merge login-merge` ← `fork/web/user/dashboard` resolve, and does the merge commit build and pass the client and stub tests without editing the fork's new files?

Do the trial merge in a throwaway worktree (never on a real branch), run the build and the test suites (README), and record:

1. **Content conflicts** (`helpers/messages.js`, `views/DashboardView.vue`, `views/LoginView.vue`, `views/ScanView.vue`, `views/TreatmentDetailView.vue`): which side per hunk. Settled: keep our `LoginView` review fixes and re-apply only missing fork wording; keep our `ScanView` flow, `messages.js` and `TreatmentDetailView` (drop the fork's prototype note), taking the fork's rebrand and layout where it carries no old-flow code; Dashboard takes the fork layout with our wording and data.
2. **Modify/delete** (`stores/proposal.js`, `stub/proposals.js` and their tests): stay deleted.
3. **Clean merges that break at runtime:** `stores/lineHistory.js` and its test read line status `proposals` and `/cycles/{id}/proposal`. Can they stay on our version at the merge commit, with `TreatmentJourney` unmounted, and still build green? List every test that fails at the merge commit and why.
4. **Follow-up commit contents:** mockup assets moved under `tasks/` as design references, the README log line, `ProfileView.vue`, the `/profile` route and any layout link to it.

Resolved when the answer lists the resolution per file, the build and test result at the merge commit, and the follow-up commit's file list.

## Resolution

Rank standard; self-decided. Trial merge of `fork/web/user/dashboard` into `login-merge` in a throwaway worktree (removed). Result: build, client tests (228), stub tests (53) and server tests (14) all pass at the merge commit with the resolution below. Nothing on a real branch was touched.

**Per file**
- `helpers/messages.js`: ours (the fork's `unknown_proposal` and `invalid_option` stay out).
- `views/LoginView.vue`: ours. The fork's only conflicting addition is the Remember me checkbox, which `091d4a2` dropped as dead. No fork wording is missing.
- `views/ScanView.vue`: ours (three steps, the suggestion update state). The fork's four-step stepper and `TreatmentJourney` mount come in with the Treatment Review shell slice.
- `views/TreatmentDetailView.vue`: ours; the fork's prototype note is dropped.
- `views/DashboardView.vue`: ours at the merge commit. The fork's layout (greeting, clock, refresh) is hand-merged in the Dashboard slice, not here: the conflict covers most of the file and is wording plus data, not a clean take.
- `stores/proposal.js`, `stub/proposals.js` and their tests: deleted (modify/delete, ADR-0037).
- Clean merges kept from the fork: `WeekCharts.vue` (tooltips only), `AppLayout.vue`, `AdminLayout.vue`, `base.css`, `router.js` (its `/profile` line goes in the follow-up), `scan.js`, the new `TreatmentJourney.vue`, `WeatherRisk.vue`, `SprayLog.vue` (unmounted).
- **`stores/lineHistory.js`, its test and `LineHistory.vue`: our `login-merge` versions, not the fork's.** The fork's copies merge cleanly and pass their own mocked tests, but read line status `proposals` and `/cycles/{id}/proposal`, so Scan step 1 would fail on our flow. They move to the Line Insights store slice.

**Two fixes the merge needs to stay green (not conflicts)**
1. `bananaleaf2.png` stays: the fork's `AppLayout.vue` imports it as the sidebar image and `36b7160` had deleted it as a spare. Without it the build fails.
2. The prototype catalog goes in the merge commit, not later: `stub/prototype.js` (+ test), `stores/prototype.js` (+ test) and the `prototypeRoutes` line in `stub/server.js` (ours restored). `stub/prototype.js` reads `line.proposals`, which our stub no longer has, so its tests fail otherwise; nothing mounted reads it. The prototype-removal slice shrinks to what is left: nothing reads the catalog after the merge, so only the unmounted `TreatmentJourney`, `WeatherRisk` and `SprayLog` still import deleted modules (`proposal`, `prototype`) until their screen slices rewrite them. They are never bundled or tested, so the build and tests stay green.

**Follow-up commit** (after the merge commit):
- Move the nine `assets/*.html` mockups (`bogart-web-1..7-*`, `toka-ai-leaf-scan`, `toka-ai-user-dashboard`) under `tasks/` as design references (the two `Toka AI – ….html` login mockups stay deleted: the login merge removed them and the fork did not change them since).
- Remove the `README.md` line "Treatment review prototype: with `VITE_STUB_SAMPLES=1`, …" (a design log line, and false once the catalog is gone).
- Remove `views/ProfileView.vue`, the `profile` route in `router.js:16` and the "My Profile" link in `AppLayout.vue:21`.

**Effects on the map**
- The Dashboard slice owns the fork's layout (not the merge).
- The prototype-removal slice is smaller; the sample-text slice must also cover `VITE_STUB_SAMPLES` copy that remains in `stubSamples.js`.
- Merge commit is a plain `git merge --no-ff` with the resolution above; no history rewrite.
