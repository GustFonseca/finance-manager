import { TaxReportDto } from '../types';

export const report = (overrides: Partial<TaxReportDto> = {}): TaxReportDto => ({
  year: 2025,
  incomeCents: 7800000,
  expenseCents: 5400000,
  deductibleCents: 650000,
  incomes: [
    { name: 'Empresa X', document: '12345678000190', cents: 7200000, count: 12 },
    { name: 'Cliente Y', document: null, cents: 600000, count: 2 },
  ],
  deductibles: [
    {
      label: 'Saúde',
      cents: 450000,
      providers: [
        { name: 'Dra. Ana', document: '12345678901', cents: 300000, count: 6 },
        { name: 'Laboratório', document: '123', cents: 150000, count: 1 },
      ],
    },
    { label: 'Educação', cents: 200000, providers: [{ name: 'Escola', document: null, cents: 200000, count: 10 }] },
  ],
  ...overrides,
});
