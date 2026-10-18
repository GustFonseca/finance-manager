import { buildGrid, formatDayTitle, kindsOf } from '../grid';

const utcDay = (year: number, month: number, day: number) => new Date(Date.UTC(year, month - 1, day)).toISOString();

describe('buildGrid', () => {
  it('starts on the right weekday and pads the last week', () => {
    const day = { date: utcDay(2026, 10, 3), incomeCents: 0, expenseCents: 100, expectedInCents: 0, expectedOutCents: 0, items: [] };
    const cells = buildGrid('2026-10', [day]);

    expect(cells).toHaveLength(35);
    expect(cells.slice(0, 4)).toEqual([null, null, null, null]);
    expect(cells[4]).toEqual({ day: 1, data: undefined });
    expect(cells[6]).toEqual({ day: 3, data: day });
    expect(cells[34]).toEqual({ day: 31, data: undefined });
  });

  it('fills whole weeks without padding', () => {
    const cells = buildGrid('2026-02', []);
    expect(cells).toHaveLength(28);
    expect(cells[0]).toEqual({ day: 1, data: undefined });
  });
});

describe('kindsOf', () => {
  it('lists each kind of item once', () => {
    expect(kindsOf(undefined)).toEqual([]);
    expect(
      kindsOf({
        date: '',
        incomeCents: 0,
        expenseCents: 0,
        expectedInCents: 0,
        expectedOutCents: 0,
        items: [
          { kind: 'EXPENSE', name: 'a', amountCents: 1 },
          { kind: 'EXPENSE', name: 'b', amountCents: 1 },
          { kind: 'SEASONAL', name: 'c', amountCents: 1 },
        ],
      })
    ).toEqual(['EXPENSE', 'SEASONAL']);
  });
});

describe('formatDayTitle', () => {
  it('reads the day in UTC so midnight dates keep their day', () => {
    expect(formatDayTitle(utcDay(2026, 10, 3))).toBe('sábado, 3 de outubro');
  });
});
