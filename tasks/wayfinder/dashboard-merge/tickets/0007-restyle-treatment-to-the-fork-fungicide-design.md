---
id: "0007"
title: "Restyle /treatment to the fork's fungicide design"
map: dashboard-merge
labels: [wayfinder:grilling]
status: closed
assignee: "archelaus"
blocked_by: ["0006"]
---

**Model:** Sonnet. A design carry-over onto decided helpers.

## Question

Which parts of the fork's fungicide list and details design carry over to `/treatment` (`ProductCard` and its view), and what stays as it is?

- The tier sections, option row, pills and "Use caution" section from the field map: does `ProductCard` take them, reading `unitFacts` and the excluded reason table instead of its own `frac`/`details` reads?
- The details content (identity, use information, eligibility checks, caution card): an expandable part of the card, or a link to the journey's details page?
- What `/treatment` keeps that the journey has not: recording an application with its confirmation, the schedule calendar and timeline, `other_guidance`.
- Which `facts` members `/treatment` shows that the journey leaves out (registrations, dilutions, coverage, methods), if any.

## Resolution

Rank standard; self-decided (client-internal; `/treatment` keeps its routes, fields and recording flow). Four questions, all A. Full questions: `decisions/wayfinder--dashboard-merge--treatment-restyle--grilling.md`.

- **`ProductCard` takes the fork's list look, not a rewrite.** `/treatment` already has the three tiers. The card keeps its checks strips and reads `unitFacts(unit)` for its pills (FRAC, Multi-site or Single-site, mobility) in place of its own `frac`/`details`/`multisite` reads. Excluded cards use the journey's "Excluded options" heading, the shared excluded-reason table and the same alert order. The fork's combo-card styling goes on the Recommended tier; price is greyed like the journey's.
- **Details stay inside the card.** The card's `<details>` ("N of M checks passed · Details") gains the product-information rows (identity, mobility pills, rate, rainfast, interval, formulation and price greyed) from one shared `ProductFacts.vue` that the journey's details page also uses (DRY). The application window and next assessment stay journey-only; `/treatment` already shows the schedule in its calendar.
- **`/treatment` keeps as it is:** the basis line, record-an-application form and its confirmation, `ScheduleCalendar`, `other_guidance`, the "needs confirmation" mark and the update state.
- **No extra `facts` shown** (registrations, dilutions, coverage, methods): no named need (YAGNI).
- **Order:** this slice comes after the journey's fungicide slice, since it reuses `unitFacts`, the reason table and `ProductFacts.vue`.
