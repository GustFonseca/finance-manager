import {
  isCurrentMonth,
  longMonthOf,
  monthKeyOf,
  monthLabel,
  monthRange,
  shortMonthOf,
  twelveMonthsUntil,
  yearRange,
} from '../periods';

afterEach(() => jest.useRealTimers());

describe('monthKeyOf', () => {
  it('builds a zero-padded year-month key', () => {
    expect(monthKeyOf(new Date(2026, 0, 15))).toBe('2026-01');
    expect(monthKeyOf(new Date(2026, 11, 1))).toBe('2026-12');
  });
});

describe('monthRange', () => {
  it('covers the whole month up to the last millisecond', () => {
    expect(monthRange('2026-02')).toEqual({
      start: new Date(2026, 1, 1).toISOString(),
      end: new Date(2026, 1, 28, 23, 59, 59, 999).toISOString(),
    });
  });
});

describe('twelveMonthsUntil', () => {
  it('starts eleven months before the given month', () => {
    expect(twelveMonthsUntil('2026-10')).toEqual({
      start: new Date(2025, 10, 1).toISOString(),
      end: new Date(2026, 9, 31, 23, 59, 59, 999).toISOString(),
    });
  });
});

describe('yearRange', () => {
  it('covers the whole year', () => {
    expect(yearRange(2025)).toEqual({
      start: new Date(2025, 0, 1).toISOString(),
      end: new Date(2025, 11, 31, 23, 59, 59, 999).toISOString(),
    });
  });
});

describe('month labels', () => {
  it('names the month in Portuguese', () => {
    expect(monthLabel('2026-03')).toBe('março de 2026');
    expect(longMonthOf(new Date(2026, 4, 10).toISOString())).toBe('maio de 2026');
  });

  it('abbreviates the month without the trailing dot', () => {
    expect(shortMonthOf(new Date(2026, 1, 10).toISOString())).toBe('fev');
  });
});

describe('isCurrentMonth', () => {
  it('compares against today', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 18));

    expect(isCurrentMonth('2026-10')).toBe(true);
    expect(isCurrentMonth('2026-09')).toBe(false);
  });
});
