import { describe, it, expect } from 'vitest';
import { canopyLabel, progressionReading, outcomeText, canopyScale, percentOf, rainOutlookText } from './insights.js';

describe('insights text', () => {
  it('words each canopy status, hides null and passes an unknown one through', () => {
    expect([canopyLabel('ok'), canopyLabel('watch'), canopyLabel('critical'), canopyLabel(null), canopyLabel('new')]).toEqual(['OK', 'Watch', 'Critical', null, 'new']);
  });
  it('finds the R1 reading by its rule prefix', () => {
    expect(progressionReading([{ rule: 'R3 Functional leaves' }, { rule: 'R1 Disease trend', finding: 'x' }]).finding).toBe('x');
    expect(progressionReading([{ rule: 'R3 Functional leaves' }])).toBeNull();
    expect(progressionReading(undefined)).toBeNull();
  });
  it('words the scheduler result', () => {
    expect([outcomeText(null), outcomeText('continue_monitoring'), outcomeText('human_review_required'), outcomeText('odd')]).toEqual(['Treatment suggested', 'Continue monitoring', 'Expert review suggested', 'odd']);
  });
  it('scales the canopy meter to 1.2 times the target or the value', () => {
    expect(canopyScale(6, 10)).toBe(12);
    expect(canopyScale(15, 10)).toBe(15);
    expect(canopyScale(null, null)).toBe(1);
    expect(percentOf(6, 12)).toBe(50);
    expect(percentOf(null, 12)).toBe(0);
  });
  it('counts rain days and not-reported days, and says when the weather is unchecked', () => {
    const days = [{ status: 'rain' }, { status: 'rain' }, { status: 'dry' }, { status: 'not_reported' }, { status: 'dry' }];
    expect(rainOutlookText({ status: 'ok', rain_above_mm: 0, days })).toBe('Rain on 2 of the next 5 days, 1 not reported (rain means over 0 mm)');
    expect(rainOutlookText({ status: 'ok', rain_above_mm: null, days: days.slice(2, 3) })).toBe('Rain on 0 of the next 1 days');
    expect(rainOutlookText({ status: 'weather_not_yet_checked', days })).toBe('Weather not yet checked.');
    expect(rainOutlookText(null)).toBe('Weather not yet checked.');
  });
});
