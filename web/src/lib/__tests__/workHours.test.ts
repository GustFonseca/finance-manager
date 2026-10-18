import { workHoursOf } from '../workHours';

describe('workHoursOf', () => {
  it('returns nothing without an amount or an hour value', () => {
    expect(workHoursOf(0, 5000)).toBeNull();
    expect(workHoursOf(-100, 5000)).toBeNull();
    expect(workHoursOf(1000, 0)).toBeNull();
    expect(workHoursOf(1000, -1)).toBeNull();
  });

  it('shows minutes under one hour with at least one minute', () => {
    expect(workHoursOf(2500, 5000)).toBe('≈ 30 min de trabalho');
    expect(workHoursOf(1, 5000)).toBe('≈ 1 min de trabalho');
  });

  it('shows hours with one decimal the Brazilian way', () => {
    expect(workHoursOf(5000, 5000)).toBe('≈ 1 h de trabalho');
    expect(workHoursOf(6000, 5000)).toBe('≈ 1,2 h de trabalho');
    expect(workHoursOf(1000000, 3125)).toBe('≈ 320 h de trabalho');
  });
});
