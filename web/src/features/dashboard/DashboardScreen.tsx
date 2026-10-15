import React, { useMemo } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText, ProgressBar } from '@/components/ui';
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
  const { user, signOut } = useAuth();
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

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetchAll} />}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}</Text>
        <Pressable onPress={signOut}>
          <Text style={styles.signOut}>Sair</Text>
        </Pressable>
      </View>

      {summaryQuery.data && <SummaryCards summary={summaryQuery.data} />}

      {activeGoals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metas Ativas</Text>
          {activeGoals.map((goal) => (
            <View key={goal.id} style={styles.goalMini}>
              <Text style={styles.goalName} numberOfLines={1}>
                {goal.name}
              </Text>
              <View style={styles.goalBar}>
                <ProgressBar percent={goal.progressPercent} height={6} />
              </View>
              <Text style={styles.goalPercent}>{goal.progressPercent.toFixed(0)}%</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimas Transações</Text>
        {recentTransactions.length === 0 && (
          <Text style={styles.empty}>Nenhuma transação este mês</Text>
        )}
        {recentTransactions.map((txn) => (
          <Card key={txn.id} style={styles.txnRow}>
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
          </Card>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    paddingTop: spacing.sm,
  },
  greeting: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary },
  signOut: { color: colors.expense, fontWeight: '600' },
  section: { padding: spacing.lg },
  sectionTitle: {
    fontSize: fontSize.lg,
    fontWeight: '600',
    marginBottom: spacing.md,
    color: colors.textPrimary,
  },
  empty: { color: colors.textSecondary, fontStyle: 'italic' },
  goalMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: spacing.sm,
  },
  goalName: { width: 100, fontSize: fontSize.sm, fontWeight: '500', color: colors.textPrimary },
  goalBar: { flex: 1 },
  goalPercent: { width: 40, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right' },
  txnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  txnInfo: { flex: 1, marginRight: spacing.md },
  txnDesc: { fontSize: fontSize.sm + 1, fontWeight: '500', color: colors.textPrimary },
  txnDate: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  txnValue: { fontSize: fontSize.md, fontWeight: '600' },
});
