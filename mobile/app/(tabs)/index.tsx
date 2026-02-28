import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { summaryApi, transactionsApi, goalsApi, FinancialSummaryDto, TransactionDto, GoalDto } from '../../services/api';
import { MoneyDisplay } from '../../components/MoneyDisplay';
import { useAuth } from '../../contexts/AuthContext';
import { colors } from '@/constants/theme';

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const [summary, setSummary] = useState<FinancialSummaryDto | null>(null);
  const [recentTxns, setRecentTxns] = useState<TransactionDto[]>([]);
  const [activeGoals, setActiveGoals] = useState<GoalDto[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const end = now.toISOString();

      const [sumRes, txnRes, goalRes] = await Promise.all([
        summaryApi.get(start, end),
        transactionsApi.getAll(start, end),
        goalsApi.getAll(),
      ]);

      setSummary(sumRes.data);
      setRecentTxns(txnRes.data.slice(0, 5));
      setActiveGoals(goalRes.data.filter((g) => g.status === 'ACTIVE'));
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  async function onRefresh() {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}</Text>
        <TouchableOpacity onPress={signOut}>
          <Text style={styles.signOut}>Sair</Text>
        </TouchableOpacity>
      </View>

      {summary && (
        <View style={styles.summaryCards}>
          <View style={[styles.card, styles.balanceCard]}>
            <Text style={styles.cardLabel}>Saldo do mês</Text>
            <MoneyDisplay amountCents={summary.balanceCents} style={styles.balanceValue} showSign />
          </View>
          <View style={styles.row}>
            <View style={[styles.card, styles.halfCard]}>
              <Text style={styles.cardLabel}>Receitas</Text>
              <MoneyDisplay amountCents={summary.totalIncomeCents} style={styles.incomeValue} />
            </View>
            <View style={[styles.card, styles.halfCard]}>
              <Text style={styles.cardLabel}>Despesas</Text>
              <MoneyDisplay amountCents={summary.totalExpenseCents} style={styles.expenseValue} />
            </View>
          </View>
        </View>
      )}

      {activeGoals.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Metas Ativas</Text>
          {activeGoals.map((goal) => (
            <View key={goal.id} style={styles.goalMini}>
              <Text style={styles.goalName}>{goal.name}</Text>
              <View style={styles.goalProgress}>
                <View style={[styles.goalBar, { width: `${Math.min(goal.progressPercent, 100)}%` }]} />
              </View>
              <Text style={styles.goalPercent}>{goal.progressPercent.toFixed(0)}%</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Últimas Transações</Text>
        {recentTxns.length === 0 && <Text style={styles.empty}>Nenhuma transação este mês</Text>}
        {recentTxns.map((txn) => (
          <View key={txn.id} style={styles.txnRow}>
            <View>
              <Text style={styles.txnDesc}>{txn.description || txn.categoryName}</Text>
              <Text style={styles.txnDate}>
                {new Date(txn.date).toLocaleDateString('pt-BR')} · {txn.accountName}
              </Text>
            </View>
            <MoneyDisplay
              amountCents={txn.type === 'EXPENSE' ? -txn.amountCents : txn.amountCents}
              style={txn.type === 'EXPENSE' ? styles.expenseValue : styles.incomeValue}
            />
          </View>
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
    padding: 16,
    paddingTop: 8,
  },
  greeting: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  signOut: { color: colors.expense, fontWeight: '600' },
  summaryCards: { paddingHorizontal: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  balanceCard: { alignItems: 'center' },
  halfCard: { flex: 1 },
  row: { flexDirection: 'row', gap: 8 },
  cardLabel: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  balanceValue: { fontSize: 28, fontWeight: '700' },
  incomeValue: { fontSize: 18, fontWeight: '600', color: colors.income },
  expenseValue: { fontSize: 18, fontWeight: '600', color: colors.expense },
  section: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 12, color: colors.textPrimary },
  empty: { color: colors.textSecondary, fontStyle: 'italic' },
  goalMini: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 8,
  },
  goalName: { width: 100, fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  goalProgress: {
    flex: 1,
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  goalBar: { height: '100%', backgroundColor: colors.income, borderRadius: 3 },
  goalPercent: { width: 40, fontSize: 12, color: colors.textMuted, textAlign: 'right' },
  txnRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 8,
    marginBottom: 6,
  },
  txnDesc: { fontSize: 15, fontWeight: '500', color: colors.textPrimary },
  txnDate: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
});
