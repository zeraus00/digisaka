// How the treatment screen is entered from a scan. `scan` is the scan store: line, week, step and the run a verified scan started.
const matches = (scan, line, week) => !!scan.line && scan.line === line && scan.week === week;

// A scan of this line and week with a started run is followed as it is; anything else loads the suggestion.
export function entryOf({ scan, line, week }) {
  return matches(scan, line, week) && scan.reschedule ? { kind: 'follow', cycleId: scan.reschedule.cycle_id } : { kind: 'load' };
}

// "Back to scan results" shows only for the scan of this line and week, once it has reached Results (step 3).
export const showBackToScan = ({ scan, line, week }) => matches(scan, line, week) && scan.step === 3;
