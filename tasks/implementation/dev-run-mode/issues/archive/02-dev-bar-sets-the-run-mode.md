# 02: The dev bar sets the run mode

**Rank:** standard: dev-build client only; no route or shape changes.

**Model:** Sonnet

**What to build:** In a dev build against the stub, the footer dev chip has a "Scan runs" select (Normal, Fail, Stuck) beside the dev date. Choosing a mode sets it at once (no Set button); the select is disabled while a call is in flight; an error shows next to it like the date's. A mode other than Normal gets the warn style so it is easy to notice. Against the real scheduler in dev, the route does not answer, so only the date group shows; with neither group available the chip does not render. On a phone width the chip wraps to two rows with no new layout.

- **Rename.** `DevDateBar` becomes `DevBar` (region label "Development tools"); its one import in the app layout changes. Each group shows only when its own store reports available.
- **Own store.** A new run-mode store with the shape of the dev clock store (available, mode, error, busy; load in a dev build only; set), loaded at app start beside the dev clock. Not folded into the dev clock store.
- **Docs.** `CLAUDE.md`'s stub paragraph names `DevBar` and the run-mode store in place of `DevDateBar`; the README *Run mode* bullet (from ticket 01) names the control.

**Blocked by:** 01 (the stub route).

**Status:** done

- [x] Store tests (after the dev clock store tests): load adopts the mode when the route answers; unavailable on 404, 401 and 500; no request outside a dev build; set PUTs and adopts the answer; an error shows its message; a second call while busy is ignored
- [x] One contract test in `stub-contract/` drives the run-mode store against the in-process stub: load, set Fail, read back (the route is stub-only, so nothing else checks its shape)
- [x] `DevBar` render test (SSR, stores preset): date group only, run-mode group only, both, neither renders nothing, warn style on a non-Normal mode
- [x] Client tests and the build pass
- [x] By hand in the stub app (use the `run` skill): the select sets each mode; Fail then a scan shows the failed card and Retry recovers; the warn style while not Normal; two-row chip at 390px
