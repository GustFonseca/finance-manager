import {
  formatCents,
  formatCentsCompact,
  formatCentsForInput,
  INVALID_AMOUNT_MESSAGE,
  parseAmountToCents,
  parseSignedAmountToCents,
  parseToCents,
} from '../money';

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

  it('rejects more than two decimal places', () => {
    expect(parseToCents('1,5555')).toBeNull();
    expect(parseToCents('1.5555')).toBeNull();
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

describe('parseAmountToCents', () => {
  it.each([
    ['12,50', 1250],
    ['1.234,56', 123456],
    ['1,234.56', 123456],
    ['12.50', 1250],
    ['12.5', 1250],
    ['1234', 123400],
    ['1.234', 123400],
    ['1.234.567,8', 123456780],
    ['12,345', null],
    ['1,234', null],
    ['R$ 12,50', 1250],
    ['r$1.000,00', 100000],
    [' 7 ', 700],
    ['0', 0],
    ['0,00', 0],
  ])('parses %s as %d cents', (input, cents) => {
    expect(parseAmountToCents(input)).toBe(cents);
  });

  it.each(['', '   ', 'abc', '1e3', '0x10', '12.5.0', '-10,00', '+10', '12,', ',50', '1.23,45', 'R$', 'Infinity'])(
    'rejects %p',
    (input) => {
      expect(parseAmountToCents(input)).toBeNull();
    },
  );
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

  it('reads accounting parentheses, D/C suffixes and the Unicode minus as signs', () => {
    expect(parseSignedAmountToCents('(1.234,56)')).toBe(-123456);
    expect(parseSignedAmountToCents('1.234,56-')).toBe(-123456);
    expect(parseSignedAmountToCents('1.234,56 D')).toBe(-123456);
    expect(parseSignedAmountToCents('1.234,56 C')).toBe(123456);
    expect(parseSignedAmountToCents('5,00d')).toBe(-500);
    expect(parseSignedAmountToCents('R$ 10,00 C')).toBe(1000);
    expect(parseSignedAmountToCents('−12,34')).toBe(-1234);
    expect(parseSignedAmountToCents('- R$ 12,34')).toBe(-1234);
    expect(parseSignedAmountToCents('R$ -12,34')).toBe(-1234);
    expect(parseSignedAmountToCents('-12.345.678,90')).toBe(-1234567890);
  });

  it('rejects non-numeric input', () => {
    expect(parseSignedAmountToCents('D')).toBeNull();
    expect(parseSignedAmountToCents('()')).toBeNull();
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

describe('formatCentsCompact', () => {
  it('abbreviates thousands for chart axes', () => {
    expect(formatCentsCompact(320000)).toBe('R$ 3,2 mil');
    expect(formatCentsCompact(1500000)).toBe('R$ 15 mil');
    expect(formatCentsCompact(45050)).toBe('R$ 451');
    expect(formatCentsCompact(0)).toBe('R$ 0');
  });
});

describe('INVALID_AMOUNT_MESSAGE', () => {
  it('shows an example of a valid amount', () => {
    expect(INVALID_AMOUNT_MESSAGE).toBe('Informe um valor válido, por exemplo 150,00.');
  });
});
