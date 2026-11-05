# 02: A scan hands off to the treatment screen

**Rank:** standard: client only; no route renamed, no API change.

**Model:** Sonnet

**What to build:** After a verified scan, "Continue to weather risk" on the scan results opens the treatment screen at the Weather tab (`?step=weather`) instead of the in-scan Treatment review. The scan's in-flight suggestion update keeps going and shows on the Spray Log tab, and a link takes the Practitioner back to the scan results.

- **Remove the in-scan review.** Scan step 4 and the old treatment journey component go; its step pages are the tabs from ticket 01. The scan has three steps.
- **The scan keeps its step.** The scan's current step moves into the scan store, so returning to the scan opens on Results and not step 1. Picking another line or week, and "New scan", reset it to step 1. A return to Results while a run is still going follows that run again.
- **The update follows the hand-off.** On opening, when the scan's line and week match the screen's and the scan has a started run, the treatment screen follows that run; otherwise it loads the suggestion as before. No second run is started.
- **Spray Log shows the update, only for a scan entry.** For a matching scan entry the Spray Log tab shows the update card while updating and on failure (with Retry), and on a timeout (with "Check again"); it shows nothing once the update is done. A Dashboard, History or Schedule entry never mounts it, so it never sees "These scans did not change it". The "Continue to fungicide options" button stays outside the card.
- **Back to scan results.** A "Back to scan results" link appears above the page title when the scan's line and week match the screen's and the scan has reached Results. It goes to the scan, which opens on Results; browser back does the same.
- **Structure.** The entry choice (follow the scan's run or load) and the back-link rule are pure helpers with unit tests.

**Blocked by:** 01: The treatment screen gets four step tabs.

**Status:** ready-for-agent

- [ ] Helper tests: a matching line and week with a started run follows that run; a different line or week, or no run, loads; the back link shows only for a matching line and week at Results
- [ ] Scan store tests: `step` is kept across routes; a new line or week and "New scan" reset it to 1
- [ ] Render tests on the treatment screen: the update card renders for a matching scan entry while updating and on failure (with Retry) and is absent once done and for a non-matching entry; "Back to scan results" renders for a matching scan at Results and is absent from a Dashboard entry
- [ ] The client tests and the build pass
- [ ] By hand in the stub app (use the `run` skill): "Continue to weather risk" mid-run opens Weather Risk, Spray Log shows the update and then nothing once it is done (this confirms the scan screen is removed before the treatment screen mounts); a failed run shows Retry; "Back to scan results" and browser back land on Results and a still-running update is followed again; a Dashboard entry shows no update card
