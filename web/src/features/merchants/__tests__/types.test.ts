import { kindLabel, MerchantKind } from '../types';

describe('kindLabel', () => {
  it('translates known kinds and keeps unknown ones', () => {
    expect(kindLabel('BUSINESS')).toBe('Empresa');
    expect(kindLabel('PERSON')).toBe('Pessoa');
    expect(kindLabel('OWN')).toBe('Suas contas');
    expect(kindLabel('OTHER' as MerchantKind)).toBe('OTHER');
  });
});
