# 02: The Scan evidence charts always show 8 weeks

**Rank:** standard: client only; Scan step 3 already loads the insights for the leaves view, and no API shape changes.

**Model:** Sonnet

**What to build:** On the cycle evidence at Scan step 3 ("What the system looked at") the charts always draw the same 8 consecutive weeks, from the insights series, with a gap week kept on the axis. Today the screen draws the last 3 weeks plus the weeks the rules compared, so the number of weeks changes from cycle to cycle and a week with no record drops out of the axis.

- **One source.** The weeks and their values come from the insights series, as in ticket 01. The rule that keeps only the last 3 weeks plus the compared ones is removed with its tests.
- **Highlights stay.** The compared weeks for the disease trend and the recent and previous rainfall weeks keep their marks and captions, matched by week. The disease and rainfall captions must still read the right weeks; check where they take their weeks from before changing anything, and stop and say so if they need a field the series does not carry.
- **Heading.** The heading no longer says "last 3 weeks and the weeks compared"; it says the last 8 weeks.
- **Not yet loaded or failed.** As in ticket 01: no chart rather than a second path.

**Blocked by:** 01: The Line insights charts always show 8 weeks.

**Status:** ready-for-agent

- [ ] Test at the screen: a cycle whose evidence has fewer or more than 5 weeks, or a gap, still draws 8 weeks; the compared and rainfall weeks keep their marks and the captions name the same weeks as before
- [ ] The retired 3-weeks-plus-compared helper and its tests are removed, and nothing else references them
- [ ] By hand in the stub app: Scan step 1 to step 3 on a line with a gap week; 8 weeks at phone width (360px)
- [ ] The client, stub and server tests and the build pass
