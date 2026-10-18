import { EmergencyFundDto, NetWorthDto, SeasonalExpensesDto } from '../types';

export const emergency = (overrides: Partial<EmergencyFundDto> = {}): EmergencyFundDto => ({
  months: 6,
  monthlyEssentialCents: 300000,
  targetCents: 1800000,
  goalId: 'g1',
  goalName: 'Reserva',
  savedCents: 450000,
  percent: 25,
  averageSavedCents: 50000,
  monthsToReach: 27,
  ...overrides,
});

export const seasonal = (overrides: Partial<SeasonalExpensesDto> = {}): SeasonalExpensesDto => ({
  monthlyReserveCents: 45000,
  items: [
    {
      label: 'IPVA',
      name: 'Detran',
      lastDate: new Date(2026, 0, 15, 12).toISOString(),
      lastCents: 240000,
      nextDate: new Date(2027, 0, 15, 12).toISOString(),
      monthsLeft: 3,
      monthlyReserveCents: 30000,
    },
    {
      label: 'Seguro',
      name: 'Porto',
      lastDate: new Date(2025, 10, 10, 12).toISOString(),
      lastCents: 120000,
      nextDate: new Date(2026, 10, 10, 12).toISOString(),
      monthsLeft: 1,
      monthlyReserveCents: 15000,
    },
  ],
  ...overrides,
});

export const netWorth = (overrides: Partial<NetWorthDto> = {}): NetWorthDto => ({
  assetsCents: 500000,
  debtsCents: 150000,
  netCents: 350000,
  accounts: [
    { name: 'Nubank', balanceCents: 520000 },
    { name: 'Inter', balanceCents: -20000 },
  ],
  history: [
    { month: new Date(2026, 8, 1).toISOString(), assetsCents: -10000 },
    { month: new Date(2026, 9, 1).toISOString(), assetsCents: 500000 },
  ],
  ...overrides,
});
