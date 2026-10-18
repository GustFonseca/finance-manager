import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { ErrorState, useDialog } from '@/components/ui';
import { Window } from '@/components/xp';
import { useGoals } from '@/features/goals/queries';
import { getErrorMessage } from '@/lib/http';
import { monthKeyOf, monthLabel, monthRange } from '@/lib/periods';
import { spacing } from '@/theme';
import { EmergencyFundCard } from './components/EmergencyFundCard';
import { NetWorthCard } from './components/NetWorthCard';
import { SeasonalCard } from './components/SeasonalCard';
import { useEmergencyFund, useNetWorth, useSeasonalExpenses, useSetEmergencyFund } from './queries';
import { EmergencyFundInput } from './types';

export function PlanningScreen() {
  const { alert } = useDialog();
  const monthKey = useMemo(() => monthKeyOf(new Date()), []);
  const month = useMemo(() => monthRange(monthKey), [monthKey]);
  const emergency = useEmergencyFund(month);
  const seasonal = useSeasonalExpenses(month);
  const netWorth = useNetWorth(month);
  const { data: goals = [] } = useGoals();
  const setEmergency = useSetEmergencyFund();

  const isFetching = emergency.isFetching || seasonal.isFetching || netWorth.isFetching;

  function refetchAll() {
    emergency.refetch();
    seasonal.refetch();
    netWorth.refetch();
  }

  async function handleEmergencyChange(input: EmergencyFundInput) {
    try {
      await setEmergency.mutateAsync(input);
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível salvar a reserva de emergência') });
    }
  }

  return (
    <Window
      title="Planejamento"
      icon="compass"
      onRefresh={refetchAll}
      status={isFetching ? 'Atualizando...' : `Planejamento de ${monthLabel(monthKey)}`}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetchAll} />}>
        {emergency.error ? (
          <ErrorState error={emergency.error} fallback="Não foi possível carregar a reserva de emergência" onRetry={emergency.refetch} />
        ) : emergency.data ? (
          <EmergencyFundCard fund={emergency.data} goals={goals} onChange={handleEmergencyChange} />
        ) : null}

        {seasonal.error ? (
          <ErrorState error={seasonal.error} fallback="Não foi possível carregar as contas sazonais" onRetry={seasonal.refetch} />
        ) : seasonal.data ? (
          <SeasonalCard seasonal={seasonal.data} />
        ) : null}

        {netWorth.error ? (
          <ErrorState error={netWorth.error} fallback="Não foi possível carregar o patrimônio" onRetry={netWorth.refetch} />
        ) : netWorth.data ? (
          <NetWorthCard netWorth={netWorth.data} />
        ) : null}
      </ScrollView>
    </Window>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
});
