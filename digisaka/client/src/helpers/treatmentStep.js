// The treatment screen's four steps, in order, and the `?step=` value that opens one.
export const STEPS = [
  { id: 'weather', label: 'Weather', icon: 'weather', title: 'Weather Risk' },
  { id: 'spray', label: 'Spray Log', icon: 'spray', title: 'Spray Log' },
  { id: 'fungicides', label: 'Fungicides', icon: 'fungicides', title: 'Fungicide Options' },
  { id: 'schedule', label: 'Schedule', icon: 'calendar', title: 'Schedule' },
];

// A missing, unknown or repeated (array) value opens Schedule.
export const stepOf = (value) => (STEPS.some((s) => s.id === value) ? value : 'schedule');
