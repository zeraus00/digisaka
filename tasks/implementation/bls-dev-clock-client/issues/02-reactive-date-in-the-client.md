# 02: The client's date follows the server and updates live

**Rank:** standard, client behaviour only.

**Model:** Sonnet.

**What to build:** `helpers/today.js` holds a Vue `ref` and `today()` and `todayIso()` read it; the code constant stays as the starting value and the fallback. A clock store asks `GET dev/today` once at start in a dev build and, when it answers, sets the date from `today` and records `default` and `pinned`; it offers `set(date)` (calls `PUT`) and `reset()` (calls `DELETE`) and updates the ref from each answer. Dashboard, the treatment screen's date `max` and the Scan screen's `maxDate` follow live. The Scan week and the application date default move only when untouched (no leaves loaded; input still holding the old default). Loaded data is not refetched. Nothing is shown to the user yet.

**Decisions:** [Which screens follow the date live](../../../wayfinder/bls-dev-clock-client/tickets/0001-which-screens-follow-the-date-live.md).

**Blocked by:** 01 (The stub backend serves the dev date routes)

**Status:** ready-for-agent

- [ ] A computed over `todayIso()` changes on `set` and on `reset`
- [ ] The store adopts the server's date when the endpoint answers; on 404, 401, 403 or a network failure it keeps the constant and marks itself unavailable
- [ ] `ScanView` moves to the new week only with no leaves loaded; the application date default moves only when unedited
- [ ] A production build never calls the endpoint
- [ ] Client tests for the store and the screens' rules pass; the client suite passes
