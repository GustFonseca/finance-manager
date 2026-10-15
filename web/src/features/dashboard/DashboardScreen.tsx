import React, { useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText, ProgressBar } from '@/components/ui';
import { Window } from '@/components/xp';
import { colors, spacing, fontSize } from '@/theme';
import { useAuth } from '@/features/auth/AuthContext';
import { useTransactions } from '@/features/transactions/queries';
import { useGoals } from '@/features/goals/queries';
import { SummaryCards } from './components/SummaryCards';
import { useSummary } from './queries';

function currentMonthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    end: now.toISOString(),
  };
}

export function DashboardScreen() {
  const { user } = useAuth();
  // Computed once on mount so the query key stays stable across renders.
  const range = useMemo(currentMonthRange, []);

  const summaryQuery = useSummary(range);
  const transactionsQuery = useTransactions(range);
  const goalsQuery = useGoals();

  const isFetching =
    summaryQuery.isFetching || transactionsQuery.isFetching || goalsQuery.isFetching;

  function refetchAll() {
    summaryQuery.refetch();
    transactionsQuery.refetch();
    goalsQuery.refetch();
  }

  const recentTransactions = (transactionsQuery.data ?? []).slice(0, 5);
  const activeGoals = (goalsQuery.data ?? []).filter((g) => g.status === 'ACTIVE');
  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <Window
      title="Painel"
      icon="line-chart"
      onRefresh={refetchAll}
      status={isFetching ? 'Atualizando...' : `Resumo de ${monthName}`}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetchAll} />}>
        <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}</Text>

        {summaryQuery.data && <SummaryCards summary={summaryQuery.data} />}

        {activeGoals.length > 0 && (
          <Card title="Metas ativas" style={styles.section}>
            {activeGoals.map((goal) => (
              <View key={goal.id} style={styles.goalRow}>
                <Text style={styles.goalName} numberOfLines={1}>
                  {goal.name}
                </Text>
                <View style={styles.goalBar}>
                  <ProgressBar percent={goal.progressPercent} height={12} />
                </View>
                <Text style={styles.goalPercent}>{goal.progressPercent.toFixed(0)}%</Text>
              </View>
            ))}
          </Card>
        )}

        <Card title="Últimas transações" style={styles.section}>
          {recentTransactions.length === 0 && (
            <Text style={styles.empty}>Nenhuma transação este mês</Text>
          )}
          {recentTransactions.map((txn) => (
            <View key={txn.id} style={styles.txnRow}>
              <View style={styles.txnInfo}>
                <Text style={styles.txnDesc}>{txn.description || txn.categoryName}</Text>
                <Text style={styles.txnDate}>
                  {new Date(txn.date).toLocaleDateString('pt-BR')} · {txn.accountName}
                </Text>
              </View>
              <MoneyText
                cents={txn.type === 'EXPENSE' ? -txn.amountCents : txn.amountCents}
                tone={txn.type === 'EXPENSE' ? 'expense' : 'income'}
                style={styles.txnValue}
              />
            </View>
          ))}
        </Card>
      </ScrollView>
    </Window>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  greeting: { fontSize: fontSize.xl, fontWeight: '700', color: '#0046D5' },
  section: { marginTop: spacing.sm },
  empty: { color: colors.textSecondary, fontStyle: 'italic', fontSize: fontSize.sm },
  goalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  goalName: { width: 120, fontSize: fontSize.sm, color: colors.textPrimary },
  goalBar: { flex: 1 },
  goalPercent: { width: 40, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right' },
  txnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFE7',
  },
  txnInfo: { flex: 1, marginRight: spacing.md },
  txnDesc: { fontSize: fontSize.md, color: colors.textPrimary },
  txnDate: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  txnValue: { fontSize: fontSize.md, fontWeight: '700' },
});
