# scheduler-reactive-suggestions (digisaka)

The scheduler no longer asks a practitioner to approve a Selection. It suggests, reschedules itself when its inputs change, and lets the practitioner record any fungicide, confirming risky picks. These tickets move the web scheduler screens to that contract. The scheduler side is built in the AI NeSy repo; this plan is the frontend half and widens the integration scope from the QA section to the QA and scheduler screens.

## The contract these tickets build against

Prefix `/api/v1/scheduler`. Error envelope unchanged: `{error, detail, ...extra}`.

- `GET /lines/{line_id}/suggestion`: `revision` (cycle id), `trigger`, `created_at`, `basis` (`stage_confirmed` | `all_healthy_images` | `no_confirmed_stage`), `line_stage` (stage, tally, 7-day window), `groups` (`recommended`, `eligible`, `excluded`; each unit: `unit_id`, `product_id`, label, practice id, `rank`, `checks`, `alerts`, `needs_confirmation`, and `reason` when excluded, including `not_for_stage`), `other_guidance`, `schedule` (the current preview's days), line-level `alerts`, `changes` (the "what changed" note, or null), `running` (a newer run is in progress), `outcome` / `outcome_reason` for a Human Review Required or continue-monitoring run.
- `POST /lines/{line_id}/applications`: request `product_id`, `applied_on`, `revision`, `confirmed`; 201 with the application and `reschedule: {cycle_id} | null`. Errors: 409 `product_not_offered`; 409 `confirmation_required` (body: current `revision`, the unit's tier, its alerts); 409 `application_already_recorded`; 400 `validation_error`.
- `POST /lines/{line_id}/weeks/{week}/diagnoses` and `POST /diagnoses/{id}/confirm-symptoms`: unchanged, plus `reschedule: {cycle_id} | null`.
- `GET /lines/{line_id}/weeks/{week}`: the week's latest run plus `runs` (id, trigger, time, changed or unchanged).
- Unchanged: line list, line status, insights, history, `GET /cycles/{id}`, `/cycles/{id}/evidence`, retry, dev clock.
- Removed (answer 404): close week, reopen, approval, rejection, renewal, `POST /selections/{id}/applications`, `GET /cycles/{id}/selection`.
- Alerts are worded to confirm ("The data suggests treatment is needed; a scan is suggested to verify."); the screens show the text as served.

## Order

01 stub and contract tests, 02 suggestion store, 03 TreatmentDetailView, 04 ScanView, 05 calendar marks, 06 dead code. Ticket 01 can start once the scheduler tickets for the suggestion read, the record route and the reschedule fields exist, or earlier against the contract above; the screens need the stub, not the live scheduler.
