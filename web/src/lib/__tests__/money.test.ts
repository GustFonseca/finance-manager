import { formatCents, formatCentsForInput, parseSignedAmountToCents, parseToCents } from '../money';

/**
 * `Intl` separates the currency symbol from the digits with a non-breaking
 * space, which is invisible in a diff — normalise it so the expectations below
 * stay readable.
 */
const normalize = (value: string) => value.replace(/ /g, ' ');

describe('formatCents', () => {
  it('formats cents as Brazilian Real', () => {
    expect(normalize(formatCents(123456))).toBe('R$ 1.234,56');
  });

  it('formats zero', () => {
    expect(normalize(formatCents(0))).toBe('R$ 0,00');
  });

  it('prefixes negative amounts with a minus sign', () => {
    expect(normalize(formatCents(-5000))).toBe('- R$ 50,00');
  });

  it('only prefixes positive amounts with a plus when asked', () => {
    expect(normalize(formatCents(5000))).toBe('R$ 50,00');
    expect(normalize(formatCents(5000, { signed: true }))).toBe('+ R$ 50,00');
  });

  it('never prefixes zero with a plus', () => {
    expect(normalize(formatCents(0, { signed: true }))).toBe('R$ 0,00');
  });
});

describe('parseToCents', () => {
  it('parses a plain pt-BR amount', () => {
    expect(parseToCents('150,00')).toBe(15000);
  });

  it('parses an amount with a thousands separator', () => {
    expect(parseToCents('1.234,56')).toBe(123456);
  });

  it('parses an integer amount with no decimals', () => {
    expect(parseToCents('42')).toBe(4200);
  });

  it('ignores surrounding whitespace', () => {
    expect(parseToCents('  99,90  ')).toBe(9990);
  });

  it('rounds to the nearest cent', () => {
    expect(parseToCents('0,015')).toBe(2);
  });

  it('rejects empty, zero, negative and non-numeric input', () => {
    expect(parseToCents('')).toBeNull();
    expect(parseToCents('   ')).toBeNull();
    expect(parseToCents('0')).toBeNull();
    expect(parseToCents('0,00')).toBeNull();
    expect(parseToCents('-10,00')).toBeNull();
    expect(parseToCents('abc')).toBeNull();
  });
});

describe('formatCents / parseToCents round-trip', () => {
  it('survives a round-trip through the formatted string', () => {
    for (const cents of [1, 99, 100, 12345, 99999999]) {
      const typed = normalize(formatCents(cents)).replace('R$ ', '');
      expect(parseToCents(typed)).toBe(cents);
    }
  });
});

describe('parseSignedAmountToCents', () => {
  it('parses dot-decimal amounts exported by banks', () => {
    expect(parseSignedAmountToCents('23.45')).toBe(2345);
    expect(parseSignedAmountToCents('-1500.00')).toBe(-150000);
    expect(parseSignedAmountToCents('7.5')).toBe(750);
  });

  it('parses pt-BR amounts with thousands separators', () => {
    expect(parseSignedAmountToCents('-1.234,56')).toBe(-123456);
    expect(parseSignedAmountToCents('R$ 10,00')).toBe(1000);
  });

  it('parses integers and an explicit plus sign', () => {
    expect(parseSignedAmountToCents('42')).toBe(4200);
    expect(parseSignedAmountToCents('+0.99')).toBe(99);
  });

  it('rejects non-numeric input', () => {
    expect(parseSignedAmountToCents('')).toBeNull();
    expect(parseSignedAmountToCents('abc')).toBeNull();
  });
});

describe('formatCentsForInput', () => {
  it('formats cents the way parseToCents reads them back', () => {
    expect(formatCentsForInput(123450)).toBe('1.234,50');
    expect(parseToCents(formatCentsForInput(123450))).toBe(123450);
    expect(formatCentsForInput(5)).toBe('0,05');
  });
});
