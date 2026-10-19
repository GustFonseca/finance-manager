import React, { useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Card, EmptyState, ErrorState, FormError, Input, MoneyText, useDialog } from '@/components/ui';
import { Window } from '@/components/xp';
import { getErrorMessage } from '@/lib/http';
import { formatCents, INVALID_AMOUNT_MESSAGE, parseAmountToCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { DebtForm, formatRate } from './components/DebtForm';
import { StrategyCard } from './components/StrategyCard';
import { useDebtPlan, useDebts, useDeleteDebt, useSaveDebt } from './queries';
import { DebtDto, DebtInput } from './types';

export function DebtsScreen() {
  const { confirm, alert } = useDialog();
  const { data: debts = [], error, isFetching, refetch } = useDebts();
  const saveDebt = useSaveDebt();
  const deleteDebt = useDeleteDebt();
  const [formVisible, setFormVisible] = useState(false);
  const [editing, setEditing] = useState<DebtDto | null>(null);
  const [extraText, setExtraText] = useState('');
  const [extraCents, setExtraCents] = useState(0);
  const [extraError, setExtraError] = useState<string | null>(null);
  const plan = useDebtPlan(extraCents, debts.length > 0);

  const total = debts.reduce((sum, debt) => sum + debt.balanceCents, 0);

  function openCreate() {
    setEditing(null);
    setFormVisible(true);
  }

  function openEdit(debt: DebtDto) {
    setEditing(debt);
    setFormVisible(true);
  }

  async function handleSave(data: DebtInput) {
    try {
      await saveDebt.mutateAsync({ id: editing?.id ?? null, data });
      setFormVisible(false);
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível salvar a dívida') });
    }
  }

  async function handleDelete(debt: DebtDto) {
    const ok = await confirm({
      title: 'Remover dívida',
      message: `Deseja remover a dívida "${debt.name}"?`,
      confirmLabel: 'Remover',
      destructive: true,
    });
    if (!ok) return;
    try {
      await deleteDebt.mutateAsync(debt.id);
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível remover a dívida') });
    }
  }

  function simulate() {
    const cents = extraText.trim() === '' ? 0 : parseAmountToCents(extraText);
    setExtraError(cents === null ? INVALID_AMOUNT_MESSAGE : null);
    if (cents !== null) setExtraCents(cents);
  }

  function refreshAll() {
    refetch();
    if (debts.length > 0) plan.refetch();
  }

  const data = plan.data;

  return (
    <>
      <Window
        title="Dívidas"
        icon="credit-card"
        actions={[{ label: 'Nova dívida', icon: 'plus-circle', onPress: openCreate }]}
        onRefresh={refreshAll}
        status={isFetching ? 'Atualizando...' : `${debts.length} dívida(s) · ${formatCents(total)} no total`}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refreshAll} />}>
          {error ? (
            <ErrorState error={error} fallback="Não foi possível carregar as dívidas" onRetry={refetch} />
          ) : debts.length === 0 ? (
            <EmptyState message="Nenhuma dívida cadastrada. Use Nova dívida para montar seu plano de quitação." />
          ) : (
            <>
              <Card title="Suas dívidas">
                {debts.map((debt) => (
                  <View key={debt.id} style={styles.row}>
                    <View style={styles.info}>
                      <Text style={styles.name}>{debt.name}</Text>
                      <Text style={styles.meta}>
                        {formatRate(debt.monthlyRatePercent)}% ao mês · parcela mínima de {formatCents(debt.minimumPaymentCents)}
                      </Text>
                    </View>
                    <MoneyText cents={debt.balanceCents} tone="expense" style={styles.balance} />
                    <View style={styles.actions}>
                      <Button size="sm" label="Editar" variant="secondary" onPress={() => openEdit(debt)} />
                      <Button size="sm" label="Remover" variant="danger" onPress={() => handleDelete(debt)} />
                    </View>
                  </View>
                ))}
              </Card>

              <Card title="Simulador de quitação">
                <View style={styles.simulator}>
                  <View style={styles.extra}>
                    <Input
                      label="Extra por mês além das parcelas mínimas:"
                      placeholder="ex: 300,00"
                      keyboardType="decimal-pad"
                      value={extraText}
                      onChangeText={setExtraText}
                      onSubmitEditing={simulate}
                    />
                  </View>
                  <Button label="Simular" onPress={simulate} />
                </View>
                <FormError message={extraError} />
                {plan.error ? (
                  <ErrorState error={plan.error} fallback="Não foi possível simular a quitação" onRetry={plan.refetch} />
                ) : data ? (
                  <>
                    <Text style={styles.lead}>
                      Pagando {formatCents(data.monthlyBudgetCents)} por mês (parcelas mínimas + {formatCents(data.extraCents)} de
                      extra):
                    </Text>
                    <View style={styles.strategies}>
                      <StrategyCard
                        title="Avalanche"
                        description="Paga primeiro a dívida com os maiores juros."
                        strategy={data.avalanche}
                      />
                      <StrategyCard
                        title="Bola de neve"
                        description="Paga primeiro a dívida com o menor saldo."
                        strategy={data.snowball}
                      />
                    </View>
                    {data.avalanche.feasible && data.snowball.feasible ? (
                      <Text style={styles.verdict}>
                        {data.interestSavedWithAvalancheCents > 0
                          ? `A avalanche economiza ${formatCents(data.interestSavedWithAvalancheCents)} em juros.`
                          : 'As duas estratégias custam o mesmo em juros. Escolha a que te motiva mais.'}
                      </Text>
                    ) : null}
                  </>
                ) : null}
              </Card>
            </>
          )}
        </ScrollView>
      </Window>

      <DebtForm
        visible={formVisible}
        debt={editing}
        saving={saveDebt.isPending}
        onClose={() => setFormVisible(false)}
        onSubmit={handleSave}
      />
    </>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  info: { flex: 1, minWidth: 160 },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  balance: { fontSize: fontSize.md, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: spacing.xs },
  simulator: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
  extra: { flexGrow: 1, flexBasis: 220 },
  lead: { fontSize: fontSize.sm, color: colors.textPrimary, marginBottom: spacing.sm },
  strategies: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  verdict: { fontSize: fontSize.md, fontWeight: '700', color: colors.income, marginTop: spacing.md },
});
