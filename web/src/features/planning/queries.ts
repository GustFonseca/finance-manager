import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invalidateEmergencyFund } from '@/lib/invalidation';
import { queryKeys } from '@/lib/queryKeys';
import { DateRange } from '@/features/transactions/types';
import { planningApi } from './api';
import { EmergencyFundInput } from './types';

export function useEmergencyFund(range: DateRange) {
  return useQuery({
    queryKey: [...queryKeys.planning, 'emergency', range],
    queryFn: () => planningApi.emergency(range),
  });
}

export function useSeasonalExpenses(range: DateRange) {
  return useQuery({
    queryKey: [...queryKeys.planning, 'seasonal', range],
    queryFn: () => planningApi.seasonal(range),
  });
}

export function useNetWorth(range: DateRange) {
  return useQuery({
    queryKey: [...queryKeys.planning, 'net-worth', range],
    queryFn: () => planningApi.netWorth(range),
  });
}

export function useSetEmergencyFund() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: EmergencyFundInput) => planningApi.setEmergency(data),
    onSuccess: () => invalidateEmergencyFund(qc),
  });
}
