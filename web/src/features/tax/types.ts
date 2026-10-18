export type TaxParty = {
  name: string;
  document: string | null;
  cents: number;
  count: number;
};

export type TaxDeductibleGroup = {
  label: string;
  cents: number;
  providers: TaxParty[];
};

export type TaxReportDto = {
  year: number;
  incomeCents: number;
  expenseCents: number;
  deductibleCents: number;
  incomes: TaxParty[];
  deductibles: TaxDeductibleGroup[];
};
