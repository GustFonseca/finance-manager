import React, { useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText, ProgressBar, useDialog } from '@/components/ui';
import { Window } from '@/components/xp';
import { getErrorMessage } from '@/lib/http';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { BudgetForm } from './components/BudgetForm';
import { BudgetTable } from './components/BudgetTable';
import { SavingsGoalForm } from './components/SavingsGoalForm';
import { SuggestionList } from './components/SuggestionList';
import {
  currentMonth,
  useApplySuggestedBudgets,
  useSavingsPlan,
  useSetBudget,
  useSetSavingsGoal,
} from './queries';
import { CategoryBudgetDto } from './types';

/** "Plano de economia": monthly goal, category budgets and the automatic analysis of what to cut. */
export function SavingsScreen() {
  const { confirm, alert } = useDialog();
  // Computed once on mount so the query key stays stable across renders.
  const month = useMemo(currentMonth, []);
  const { data: plan, isFetching, refetch } = useSavingsPlan(month);
  const setGoal = useSetSavingsGoal();
  const setBudget = useSetBudget();
  const applySuggested = useApplySuggestedBudgets();

  const [goalVisible, setGoalVisible] = useState(false);
  const [editing, setEditing] = useState<CategoryBudgetDto | null>(null);

  async function handleGoal(cents: number) {
    try {
      await setGoal.mutateAsync(cents);
      setGoalVisible(false);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível salvar a meta') });
    }
  }

  async function handleBudget(limitCents: number | null) {
    if (!editing) return;
    try {
      await setBudget.mutateAsync({ categoryId: editing.categoryId, limitCents });
      setEditing(null);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível salvar o limite') });
    }
  }

  async function handleApplySuggested() {
    const ok = await confirm({
      title: 'Aplicar limites sugeridos',
      message: 'Definir o limite de cada categoria com o valor sugerido pela análise? Você pode ajustar cada um depois.',
      confirmLabel: 'Aplicar',
    });
    if (!ok) return;
    try {
      const applied = await applySuggested.mutateAsync(month);
      alert({ title: 'Plano de economia', message: `${applied} limite(s) definido(s).` });
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível aplicar os limites') });
    }
  }

  const goal = plan?.monthlyGoalCents ?? 0;
  const progressDay = Math.round((plan?.monthProgress ?? 0) * 100);

  return (
    <>
      <Window
        title="Plano de economia"
        icon="money"
        actions={[
          { label: 'Definir meta', icon: 'flag', onPress: () => setGoalVisible(true) },
          { label: 'Aplicar limites sugeridos', icon: 'magic', onPress: handleApplySuggested },
        ]}
        onRefresh={refetch}
        status={isFetching ? 'Analisando...' : `${progressDay}% do mês concluído`}>
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}>
          {plan ? (
            <>
              <Card title="Meta do mês">
                {goal > 0 ? (
                  <>
                    <View style={styles.goalLine}>
                      <Text style={styles.label}>Economizado até agora:</Text>
                      <MoneyText cents={plan.monthSavedCents} signed style={styles.big} />
                      <Text style={styles.label}>de {formatCents(goal)}</Text>
                    </View>
                    <ProgressBar percent={(plan.monthSavedCents / goal) * 100} />
                  </>
                ) : (
                  <Text style={styles.label}>
                    Defina quanto quer economizar por mês para acompanhar o progresso e receber limites
                    sugeridos.
                  </Text>
                )}
                <View style={styles.figures}>
                  <Figure label="Receitas no mês" cents={plan.monthIncomeCents} tone="income" />
                  <Figure label="Despesas no mês" cents={plan.monthExpenseCents} tone="expense" />
                  <Figure label="Média economizada (3 meses)" cents={plan.averageSavedCents} tone="auto" />
                </View>
              </Card>

              <Card title="Análise automática">
                {plan.potentialSavingsCents > 0 ? (
                  <Text style={styles.potential}>
                    Você pode economizar até{' '}
                    <Text style={styles.potentialValue}>{formatCents(plan.potentialSavingsCents)}</Text> por mês
                    seguindo as sugestões abaixo.
                  </Text>
                ) : null}
                <SuggestionList suggestions={plan.suggestions} />
              </Card>

              <Card title="Orçamento por categoria">
                <Text style={styles.hint}>Clique numa categoria para definir ou mudar o limite.</Text>
                <BudgetTable budgets={plan.budgets} onEdit={setEditing} />
              </Card>
            </>
          ) : null}
        </ScrollView>
      </Window>

      <SavingsGoalForm
        visible={goalVisible}
        currentCents={goal}
        averageSavedCents={plan?.averageSavedCents ?? 0}
        saving={setGoal.isPending}
        onClose={() => setGoalVisible(false)}
        onSubmit={handleGoal}
      />
      <BudgetForm
        budget={editing}
        saving={setBudget.isPending}
        onClose={() => setEditing(null)}
        onSubmit={handleBudget}
      />
    </>
  );
}

function Figure({ label, cents, tone }: { label: string; cents: number; tone: 'income' | 'expense' | 'auto' }) {
  return (
    <View style={styles.figure}>
      <Text style={styles.figureLabel}>{label}</Text>
      <MoneyText cents={cents} tone={tone} style={styles.figureValue} />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: spacing.md, gap: spacing.md },
  goalLine: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', gap: spacing.sm, marginBottom: spacing.sm },
  label: { fontSize: fontSize.sm, color: colors.textSecondary },
  big: { fontSize: fontSize.xxl - 2, fontWeight: '700' },
  figures: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.md },
  figure: { minWidth: 140 },
  figureLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  figureValue: { fontSize: fontSize.lg, fontWeight: '700' },
  potential: { fontSize: fontSize.md, color: colors.textPrimary, marginBottom: spacing.xs },
  potentialValue: { fontWeight: '700', color: colors.income },
  hint: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.sm },
});
