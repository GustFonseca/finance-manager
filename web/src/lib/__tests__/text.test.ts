import { normalizeText } from '../text';

describe('normalizeText', () => {
  it('removes accents, lowercases and collapses whitespace', () => {
    expect(normalizeText('  Padaria   São  JOÃO ')).toBe('padaria sao joao');
  });

  it('keeps already normalized text', () => {
    expect(normalizeText('ifood')).toBe('ifood');
  });
});
