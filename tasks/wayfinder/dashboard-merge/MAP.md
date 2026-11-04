---
labels: [wayfinder:map]
title: Dashboard merge
---

# Dashboard merge

## Destination

A decided spec, ready for `/to-tickets`, for bringing `fork/web/user/dashboard` into our tree by merge (on a new `dashboard-merge` branch on top of `login-merge`, keeping the fork's hashes) and re-seating its screens on the scheduler's suggestion-only flow (AI_NeSy_Framework ADR-0037): Disease Detection insights, the four-step Treatment Review (Weather, Spray log, Fungicides, then Schedule routes to `/treatment/:lineId/:week`), the Dashboard layout, sample-text removal and prototype-catalog removal.

**Acceptance:** the merge resolution is decided and known to build and pass tests; the Line Insights store is decided; the stub payloads for the decided contract fields are specified; the Treatment Review journey's suggestion wiring is decided; every element on screens A, B1, B2 and B3 has a source field, a client mapping, or a `TODO(contract)` grey-out.

## Notes

- **Planning only.** Building goes through `/to-tickets` and `implement`.
- **Designs stay, data sources change.** The fork design's layout and wording stay; its data comes from Line Insights (`GET /api/v1/scheduler/lines/{id}/weeks/{week}/insights`) and the suggestion (`GET /lines/{id}/suggestion`, `stores/suggestion.js`), never from the prototype catalog or the removed proposal routes. Nothing is approved, rejected, renewed, closed or reopened.
- **Stub first.** The scheduler's map `dashboard-contract-gaps` (AI_NeSy_Framework) decided these fields: `facts` on each suggestion unit (product and practice facts; empty means unknown), `frac_code` and `multisite` on each `history[]` entry, `group_usage[]` replacing `resistance_alerts` (one row per mode of action with count, cap, server-set `status`, own `alerts[]`), `functional_leaves_target`, per-week `canopy_status` (null hides the pill), and `actions.summary` (a server sentence). The scheduler does not serve them yet. The stub and its contract tests get them first, the screens read them, and the live run against the scheduler waits until those tickets are built. Shapes: `AI_NeSy_Framework/tasks/implementation/dashboard-contract-gaps/issues/`.
- **Not provided (stay greyed out, "Coming soon" plus `TODO(contract): <field>`):** infection risk level (card and the Weather step's level), humidity, leaf wetness, price, formulation, a label and registration eligibility check. The "Provisional threshold" chip is dropped.
- **Decided before charting (developer, 2026-11-04):** Excluded for units and Discouraged for resistance, never Restricted; one Treatment pill, active when either fungicide kind is active; `leaves_at_shooting` in the six-card slot, `functional_leaves` (the week-8 count) on the canopy meter; Dashboard keeps our wording and data inside the fork layout; mockup HTML assets move under `tasks/` as design references; the profile page is not taken; the Weather step's "data not provided" notice is dropped; the Spray log's close-week card becomes the suggestion update state, and "Continue to fungicide options" waits for a current suggestion; `/treatment` stays as it is until a last restyle ticket; safety disclaimers stay.
- **Facts already checked:** the fork's `WeekCharts.vue` keeps its props (`weeks`, `disease`, `rainfall`) and adds tooltips only, so its callers (`LineHistory.vue`, `EvidenceCharts.vue`) keep working; take the fork's version. The client ignores the live API's approval fields (`needs_approval`, `blocks_approval`).
- **Naming.** Never name the fork's author; say "the fork branch" or "the fork design".
- **Ranking** (`CLAUDE.md`). Breaking here: any API field or route not decided on the scheduler map; removing a screen or changing what one does beyond the decisions above; rewriting git history. A merge commit is not a rewrite. Stub fields that follow a decided scheduler field are standard.
- **Skills.** Grilling tickets call `grilling` and `domain-modeling`.
- **Model.** Each ticket names one.

## Decisions so far

- [Merge resolution and a green merge commit](tickets/0001-merge-resolution-and-a-green-merge-commit.md): trial merge is green (build, client, stub, server); conflicting views stay ours, `lineHistory` and `LineHistory.vue` stay ours until the store slice, the prototype catalog is deleted in the merge, `bananaleaf2.png` is kept; a follow-up commit moves mockups and drops Profile and the README line.

## Not yet specified

- The `/treatment` restyle to the fork's fungicide design: which parts of the fungicide list and details carry over to `ProductCard`, once the spray log and fungicides field map is set.
- Ticket order and waves for `/to-tickets`, once the merge and store tickets resolve (what must land before each screen, and what the stub tickets share with the screen tickets).

## Out of scope

- The profile page (`ProfileView.vue`, `/profile`): next map, `profile-auth-data`.
- Building the scheduler's fields: the `dashboard-contract-gaps` implementation tickets in AI_NeSy_Framework.
- An infection risk index, humidity, leaf wetness, price, formulation and a registration check: ruled not provided on the scheduler map.
- Renaming the live API's approval fields: a breaking scheduler change with no ticket.
