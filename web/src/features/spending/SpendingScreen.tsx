import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText, StatTile } from '@/components/ui';
import { Window } from '@/components/xp';
import { ALL_ACCOUNTS, AccountSelect } from '@/features/accounts/components/AccountSelect';
import { useAccounts } from '@/features/accounts/queries';
import { currentMonth } from '@/features/savings/queries';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { ClassSplit } from './components/ClassSplit';
import { MonthlyTrend } from './components/MonthlyTrend';
import { ReducibleList } from './components/ReducibleList';
import { TopMerchants } from './components/TopMerchants';
import { useSpendingAnalysis } from './queries';

/** "Análise de gastos": where the month's money went, how necessary it was, and what to reduce. */
export function SpendingScreen() {
  // Computed once on mount so the query key stays stable across renders.
  const month = useMemo(currentMonth, []);
  const { data: accounts = [] } = useAccounts();
  const [accountId, setAccountId] = useState(ALL_ACCOUNTS);
  const { data, isFetching, refetch } = useSpendingAnalysis({ ...month, accountId: accountId || undefined });

  const accountName = accounts.find((a) => a.id === accountId)?.name ?? 'todas as contas';
  const monthName = new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const share = (c: string) => data?.byClass.find((t) => t.class === c);

  return (
    <Window
      title="Análise de gastos"
      icon="pie-chart"
      onRefresh={refetch}
      status={isFetching ? 'Analisando...' : `Gastos de ${monthName} · ${accountName}`}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
        {/* Filters sit in one row above every chart. */}
        <View style={styles.filters}>
          <AccountSelect value={accountId} onChange={setAccountId} />
        </View>

        {data ? (
          <>
            <View style={styles.tiles}>
              <StatTile
                label="Gasto no mês"
                value={<MoneyText cents={data.monthExpenseCents} tone="neutral" style={styles.tileValue} />}
                // The month isn't over, so the average is a reference, not a comparison.
                detail={
                  data.averageExpenseCents > 0
                    ? `Até hoje. Média mensal dos 3 meses anteriores: ${formatCents(data.averageExpenseCents)}`
                    : 'Até hoje'
                }
              />
              <StatTile
                label="Supérfluo"
                value={`${Math.round((share('SUPERFLUOUS')?.share ?? 0) * 100)}%`}
                detail={`${formatCents(share('SUPERFLUOUS')?.cents ?? 0)} em delivery, lazer, compras e assinaturas`}
              />
              <StatTile
                label="Essencial"
                value={`${Math.round((share('ESSENTIAL')?.share ?? 0) * 100)}%`}
                detail={`${formatCents(share('ESSENTIAL')?.cents ?? 0)} em moradia, contas, saúde e educação`}
              />
              <StatTile
                label="Dá para economizar"
                value={<MoneyText cents={data.reduciblePotentialCents} tone="income" style={styles.tileValue} />}
                detail="por mês, com os cortes sugeridos abaixo"
              />
            </View>

            <Card title="Essencial, variável e supérfluo">
              <ClassSplit totals={data.byClass} />
            </Card>

            <Card title="Para onde foi o dinheiro">
              <CategoryBreakdown categories={data.byCategory} />
            </Card>

            <Card title="Evolução nos últimos 6 meses">
              <MonthlyTrend months={data.months} />
            </Card>

            <Card title="Onde você mais gastou">
              <TopMerchants merchants={data.topMerchants} />
            </Card>

            <Card title="Onde dá para reduzir">
              {data.reduciblePotentialCents > 0 ? (
                <Text style={styles.potential}>
                  Até <Text style={styles.potentialValue}>{formatCents(data.reduciblePotentialCents)}</Text> por mês,
                  pela média dos últimos meses.
                </Text>
              ) : null}
              <ReducibleList items={data.reducible} />
            </Card>
          </>
        ) : null}
      </ScrollView>
    </Window>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  filters: { flexDirection: 'row', justifyContent: 'flex-end' },
  tiles: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  tileValue: { fontSize: fontSize.xxl - 2, fontWeight: '700' },
  potential: { fontSize: fontSize.md, color: colors.textPrimary, marginBottom: spacing.xs },
  potentialValue: { fontWeight: '700', color: colors.income },
});
