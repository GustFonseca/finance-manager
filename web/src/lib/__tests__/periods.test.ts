import {
  dayToIso,
  formatDay,
  isCurrentMonth,
  isoToDay,
  formatDateTime,
  longMonthOf,
  monthKeyOf,
  monthLabel,
  monthRange,
  shortMonthOf,
  todayKey,
  todayStartIso,
  toDay,
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

  it('formats a date with its time', () => {
    expect(formatDateTime(new Date(2026, 9, 19, 14, 5).toISOString())).toBe('19/10/2026, 14:05');
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

describe('day helpers', () => {
  it('builds a day key only for real dates', () => {
    expect(toDay(2026, 2, 29)).toBeNull();
    expect(toDay(2024, 2, 9)).toBe('2024-02-09');
  });

  it('converts a day key to a midday ISO and back', () => {
    const iso = dayToIso('2026-10-03');
    expect(new Date(iso).getHours()).toBe(12);
    expect(isoToDay(iso)).toBe('2026-10-03');
  });

  it('keeps the raw prefix when the ISO is not a date', () => {
    expect(isoToDay('invalido-xx')).toBe('invalido-x');
  });

  it('returns today as a day key', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 18, 9));

    expect(todayKey()).toBe('2026-10-18');
  });
});

describe('todayStartIso', () => {
  it('gives the start of the local day as an ISO string', () => {
    jest.useFakeTimers().setSystemTime(new Date(2026, 9, 18, 21, 45));
    expect(todayStartIso()).toBe(new Date(2026, 9, 18).toISOString());
  });
});

describe('formatDay', () => {
  it('formats a local date as dd/mm/yyyy', () => {
    expect(formatDay(new Date(2026, 9, 5, 12).toISOString())).toBe('05/10/2026');
  });

  it('reads UTC-midnight days in UTC so they do not shift to the previous day', () => {
    expect(formatDay('2026-10-05T00:00:00Z', { utc: true })).toBe('05/10/2026');
  });

  it('can leave the year out', () => {
    expect(formatDay('2026-10-05T00:00:00Z', { utc: true, year: false })).toBe('05/10');
  });
});
