# 07: Restyle /treatment to the fork fungicide design

**Rank:** standard: client only; routes, fields and the recording flow are unchanged.

**Model:** Sonnet

**What to build:** On `/treatment`, product cards keep their tiers and check strips but take the fork's look: pills from the unit-facts helper, the "Excluded options" heading and reason table for excluded cards, the combo-card style on Recommended, a greyed price, and the product-information rows inside each card's details. Recording an application, its confirmation, the schedule calendar and other guidance are unchanged.

**Decisions:** [Restyle treatment to the fork fungicide design](../../../wayfinder/dashboard-merge/tickets/0007-restyle-treatment-to-the-fork-fungicide-design.md)

**Blocked by:** 06

**Status:** ready-for-agent

- [ ] The card reads no `frac`, `details` or `multisite` of its own
- [ ] The product-information rows come from the same component as the journey's details page
- [ ] The record, confirm and calendar tests still pass unchanged
