import { RuleDto } from '../types';

export const rule = (overrides: Partial<RuleDto> = {}): RuleDto => ({
  id: 'r1',
  type: 'BRAND',
  pattern: '\\bifood\\b',
  value: 'iFood',
  priority: 100,
  isActive: true,
  note: 'Delivery de comida',
  isDefault: true,
  ...overrides,
});

export const rules: RuleDto[] = [
  rule(),
  rule({
    id: 'r2',
    type: 'SUPERFLUOUS',
    pattern: 'cinema|teatro',
    value: null,
    priority: 50,
    isActive: false,
    note: 'Lazer pago',
    isDefault: false,
  }),
  rule({ id: 'r3', type: 'FEE', pattern: 'tarifa', value: 'Tarifa bancária', priority: 10, note: null, isDefault: false }),
];
