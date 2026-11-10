# Indicator-driven eligibility: screen decisions

The scheduler stops using the line's Fouré stage to decide which fungicides a line is offered. Every suggestion now starts from the full fungicide list; the stage is shown as evidence only. This file holds the screen decisions for that change, so a digisaka session can build them without the scheduler repo.

## Treatment screen: basis line

The basis line (`TreatmentDetailView.vue`, the `BASIS` map) no longer says the suggestion is based on the stage. New wording, by the suggestion's `basis` value:

| `basis` | Text |
|---|---|
| `stage_confirmed` | A scan confirmed stage N this week (N is `line_stage.stage`) |
| `all_healthy_images` | Only healthy images this week |
| `no_confirmed_stage` | No stage confirmed this week |

- The API shape is unchanged: `basis` and `line_stage` (`stage`, `tally`, `window`) stay as they are; `line_stage.stage` is the most severe stage confirmed in the last 7 days.
- The tally is not shown.
- Update `client/src/stub-contract/treatment.screen.test.js` and, if it repeats the screen text, `stub/suggestions.js` (`BASIS_TEXT`).

## Insights: the mechanical action kind

The insights `mechanical` kind ("removing diseased leaves") can now be active: the scheduler turns it on when a new sample rule advises mechanical management. The API shape is unchanged. Stub tests and payloads that assert it is always inactive (`stub/insights.test.js`, `stub/payloads/line-insights.*.json`) need a case where it is active; the screen shows it like the other kinds.

## Stage-6 alert (Stage 6 lines and demo scenarios)

- A line whose most severe confirmed stage this week is 6 gets one extra line-level alert in the suggestion's `alerts`: kind `stage_basis`, id `line:stage_basis:stage_6`, level `warning` (`info` when the run is Continue Monitoring), `unit_id` null, `blocks_approval` false.
- Text (served by the API; the screen shows it as given): "The data suggests some of the leaves scanned this week are at stage 6, past the point a fungicide protects them; removing the affected leaves may be advised."
- No new alert kind: the screen already renders `stage_basis` alerts. The fungicide list does not change because of it.
- Stub: `stub/suggestions.js` adds this alert for a stage-6 line; a stub test asserts it.

## The `not_for_stage` reason is removed

- The scheduler no longer serves `reason: not_for_stage` on any unit: every fungicide is offered whatever the stage, and an Excluded unit is out only for `rotation`, `no_interval` or a failed check. `reason` is still a free string; no field changes. Runs stored before the change never stored this value, so no response carries it after the deploy.
- Drop it in the same change as the scheduler: the label in `client/src/helpers/checks.js` (`not_for_stage`), the stub's `reasonOf` fallback in `stub/suggestions.js` (fall back to the failed check, or `rotation` for a non-selectable unit), and the assertion in `stub/suggestions.test.js` that a unit is excluded as `not_for_stage`.
- Refresh the OpenAPI copy the stub tests read, if any, from the scheduler's new export.
