import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText, ProgressBar } from '@/components/ui';
import { Window } from '@/components/xp';
import { colors, spacing, fontSize } from '@/theme';
import { ALL_ACCOUNTS, AccountSelect } from '@/features/accounts/components/AccountSelect';
import { useAccounts } from '@/features/accounts/queries';
import { useAuth } from '@/features/auth/AuthContext';
import { currentMonth } from '@/features/savings/queries';
import { useTransactions } from '@/features/transactions/queries';
import { useGoals } from '@/features/goals/queries';
import { RecurringExpenses } from './components/RecurringExpenses';
import { SummaryCards } from './components/SummaryCards';
import { useRecurringExpenses, useSummary } from './queries';

export function DashboardScreen() {
  const { user } = useAuth();
  // Computed once on mount so the query key stays stable across renders.
  const month = useMemo(currentMonth, []);
  const { data: accounts = [] } = useAccounts();
  const [accountId, setAccountId] = useState(ALL_ACCOUNTS);
  const filter = { ...month, accountId: accountId || undefined };
  const accountName = accounts.find((a) => a.id === accountId)?.name;

  const summaryQuery = useSummary(filter);
  const transactionsQuery = useTransactions(filter);
  const recurringQuery = useRecurringExpenses(filter);
  const goalsQuery = useGoals();

  const isFetching =
    summaryQuery.isFetching ||
    transactionsQuery.isFetching ||
    recurringQuery.isFetching ||
    goalsQuery.isFetching;

  function refetchAll() {
    summaryQuery.refetch();
    transactionsQuery.refetch();
    recurringQuery.refetch();
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
      status={isFetching ? 'Atualizando...' : `Resumo de ${monthName} · ${accountName ?? 'todas as contas'}`}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetchAll} />}>
        <View style={styles.header}>
          <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}</Text>
          <AccountSelect value={accountId} onChange={setAccountId} />
        </View>

        {summaryQuery.data && <SummaryCards summary={summaryQuery.data} />}

        <RecurringExpenses items={recurringQuery.data ?? []} showAccount={!accountId} />

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
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
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
