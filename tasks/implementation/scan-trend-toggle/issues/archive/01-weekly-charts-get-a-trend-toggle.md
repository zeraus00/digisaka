# 01: The weekly charts get a trend toggle (All, YLS/YLI, Rainfall)

**Rank:** standard: client only; no API change.

**Model:** Sonnet

**What to build:** Above the weekly charts, on both screens that show them (Line insights at Scan step 1 and the cycle evidence at Scan step 3), a toggle row picks what the chart area shows. The row starts on All each time the chart appears and remembers nothing else.

- **Buttons.** All (icon only, named "All trends" for assistive tech), YLS/YLI, Rainfall (icon and label). Icons are inline SVG paths added to the client's existing icon component: a grid, a two-line mark, a drop. A fourth button, Leaves, is added by ticket 02; build the row so a button is data, not markup.
- **Views.** All is one combined chart: YLS and YLI lines on the left 0–12 axis, rainfall bars (faint, behind) on a right mm axis, a key, and no prose. YLS/YLI and Rainfall are the two existing charts with their captions, shown one at a time; their captions show only on those views. The series stay apart without colour alone: YLS a solid line with circle markers, YLI a dashed line with triangle markers; the key draws each line and marker as it appears.
- **Behaviour.** A view whose series has no value in the shown weeks has a disabled button; if the shown view goes empty the chart falls back to All. All draws only the series that exist and leaves an empty one out of the key. The missing-weeks line stays visible on every view and lists only the series drawn on that view. The "Show the numbers" table is removed. Hiding a chart clears its hover tooltip.
- **Accessibility.** A labelled group of native buttons with a pressed state, 44px targets, a selected state not shown by colour alone (fill plus a check or weight), an icon-only button with a text name, a visible focus ring, left and right arrow keys moving between enabled buttons (wrapping), and a polite live line saying what is now shown. Buttons wrap on narrow screens without clipping.
- **Structure.** The view logic (which views are available, the fallback, the next button on an arrow key, the missing-weeks text per view) lives in pure helpers beside the existing evidence helpers, so it is unit tested without a DOM. The chart component takes an `initialView` prop (default All) so a test can render each view; it exists for tests only.

**Blocked by:** None (can start immediately).

**Status:** done

- [ ] Helper tests: available views, fallback to All when the pick becomes unavailable, arrow-key next button (wraps, skips disabled), missing-weeks line per view
- [ ] Render tests: the default view has a labelled group, three buttons, All pressed and named, one combined chart with a key and no prose caption; each single view shows only its own caption; a series with no values disables its button and leaves the key; the numbers table is gone
- [ ] The charts at the phone width (360px) read clearly with five weeks and crossing values; lines differ by dash and marker
- [ ] By hand in the stub app (use the `run` skill): click each view, arrow keys, the live line, focus ring, hover cleared when a chart hides, on both screens
- [ ] The client tests and the build pass
