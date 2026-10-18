export type CalendarItemKind =
  | 'INCOME'
  | 'EXPENSE'
  | 'EXPECTED_INCOME'
  | 'EXPECTED_BILL'
  | 'EXPECTED_INSTALLMENT'
  | 'SEASONAL';

export type CalendarItemDto = {
  kind: CalendarItemKind;
  name: string;
  amountCents: number;
};

export type CalendarDayDto = {
  date: string;
  incomeCents: number;
  expenseCents: number;
  expectedInCents: number;
  expectedOutCents: number;
  items: CalendarItemDto[];
};

export type CalendarDto = {
  monthStart: string;
  days: CalendarDayDto[];
};

export const KIND_COLORS: Record<CalendarItemKind, string> = {
  INCOME: '#1E7E1E',
  EXPENSE: '#C62828',
  EXPECTED_INCOME: '#7CB342',
  EXPECTED_BILL: '#EF6C00',
  EXPECTED_INSTALLMENT: '#6A1B9A',
  SEASONAL: '#0277BD',
};

export const KIND_LABELS: Record<CalendarItemKind, string> = {
  INCOME: 'Recebido',
  EXPENSE: 'Gasto',
  EXPECTED_INCOME: 'Receita prevista',
  EXPECTED_BILL: 'Conta prevista',
  EXPECTED_INSTALLMENT: 'Parcela prevista',
  SEASONAL: 'Conta sazonal',
};
