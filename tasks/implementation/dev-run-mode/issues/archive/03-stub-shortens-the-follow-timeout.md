# 03: The stub shortens the follow timeout

**Rank:** standard: dev tooling only; production poll values unchanged (the compose file is not CI).

**Model:** Sonnet

**What to build:** On the stub stack, the client gives up following a stuck scan run after about 20 seconds instead of about 3 minutes, so the "Update is taking longer than expected" card shows quickly. A new `VITE_STUB_POLL_LIMIT` is set to `10` only in the stub compose file. The follow reads it beside the poll constants: a positive whole number replaces the poll limit; missing, zero, negative, fractional or non-numeric values keep 90. The poll interval stays 2 seconds. It is not tied to dev builds, so a dev build against the real scheduler (runs of about 25 s) keeps the full limit.

- **Structure.** The reading of the value is a small pure function exported beside the constants, so tests do not stub the build environment.
- **Docs.** The README next to the sample-leaves bullet and `CLAUDE.md`'s stub paragraph name the value, say it is stub compose only and needs `up -d --build`.

**Blocked by:** None (can start immediately).

**Status:** done

- [x] Reader tests: `'10'` gives 10; missing, `'0'`, `'-3'`, `'2.5'` and `'abc'` give 90
- [x] The existing timeout test still checks `1 + POLL_LIMIT` calls
- [x] Client tests and the build pass
- [x] By hand on the rebuilt stub stack: with the stub run stuck (ticket 01 done first, or L08 until then), the timeout card shows in about 20 s
