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
- [Line Insights store](tickets/0002-line-insights-store.md): new `insights` store beside `lineHistory` (which keeps `/history` for the charts); owner screens load on mount, no cache; display-only getters; the fork's old-flow `lineHistory` reads are not ported.
- [Stub payloads for the decided fields](tickets/0003-stub-payloads-for-the-decided-fields.md): insights payload files gain the fields (KG mode-of-action codes, M row `discouraged`, canopy bands from the counts); unit `facts` are built from the recorded `real` payload; the stub follows live on the four mismatches now; one stub slice lands before the screens.
- [How the Treatment Review journey reads the suggestion](tickets/0004-how-the-treatment-review-journey-reads-the-suggestion.md): one `suggestion` store, step 3's tracking runs on into step 4; "current" is ready and not updating with a `ready`/`unchanged` update state; step 3's update card becomes a shared `SuggestionUpdate`; four steps, Schedule is a link; back from `/treatment` does not restore the journey.

- [Field map for the insights screens](tickets/0005-field-map-for-the-insights-screens.md): Disease Detection and Weather mapped element by element to insights fields, the suggestion's `outcome`, or a `TODO(contract)` grey-out (humidity, leaf wetness, infection risk level); text tables in one `helpers/insights.js`; the canopy pill is the server's verdict, the caption states numbers only; progression reads the `R1` reading by rule prefix.

- [Field map for spray log and fungicides](tickets/0006-field-map-for-spray-log-and-fungicides.md): spray history and FRAC card read `history[]` and `group_usage[]` (server status, "Discouraged" heading); one shared `InsightsSummary`; options grouped by the server's tiers with an "Excluded options" caution section; details from `facts` through one `unitFacts` helper and the real `checks[]`; empty fact reads "Unknown", not-provided fields read "Coming soon" with `TODO(contract)`.
- [Restyle /treatment to the fork's fungicide design](tickets/0007-restyle-treatment-to-the-fork-fungicide-design.md): `ProductCard` keeps its tiers and checks, reads pills from `unitFacts`, shares `ProductFacts.vue` with the journey's details page; recording flow, calendar and guidance unchanged; this slice comes after the journey's fungicide slice.

## Not yet specified

None. Ticket order and waves are set at `/to-tickets` (known: the stub slice comes first).

## Out of scope

- The profile page (`ProfileView.vue`, `/profile`): next map, `profile-auth-data`.
- Building the scheduler's fields: the `dashboard-contract-gaps` implementation tickets in AI_NeSy_Framework.
- An infection risk index, humidity, leaf wetness, price, formulation and a registration check: ruled not provided on the scheduler map.
- Renaming the live API's approval fields: a breaking scheduler change with no ticket.
