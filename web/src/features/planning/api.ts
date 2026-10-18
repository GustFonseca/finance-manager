import { http } from '@/lib/http';
import { DateRange } from '@/features/transactions/types';
import { EmergencyFundDto, EmergencyFundInput, NetWorthDto, SeasonalExpensesDto } from './types';

export const planningApi = {
  emergency: ({ start, end }: DateRange) =>
    http.get<EmergencyFundDto>('/planning/emergency', { params: { start, end } }).then((r) => r.data),
  setEmergency: (data: EmergencyFundInput) => http.put('/planning/emergency', data).then(() => undefined),
  seasonal: ({ start, end }: DateRange) =>
    http.get<SeasonalExpensesDto>('/planning/seasonal', { params: { start, end } }).then((r) => r.data),
  netWorth: ({ start, end }: DateRange) =>
    http.get<NetWorthDto>('/planning/net-worth', { params: { start, end } }).then((r) => r.data),
};
