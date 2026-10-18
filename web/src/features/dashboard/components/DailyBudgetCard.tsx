import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText } from '@/components/ui';
import { formatCents } from '@/lib/money';
import { colors, fontSize, radius, spacing } from '@/theme';
import { DailyBudgetDto } from '../types';

export function DailyBudgetCard({ daily }: { daily: DailyBudgetDto }) {
  if (!daily.isCurrentMonth) return null;

  const over = daily.leftTodayCents < 0;
  const noRoom = daily.freeToSpendCents + daily.spentTodayCents <= 0;
  const deductions = daily.monthlyGoalCents > 0
    ? `já descontando as contas fixas e a meta de economia de ${formatCents(daily.monthlyGoalCents)}`
    : 'já descontando as contas fixas';

  return (
    <Card title="Quanto posso gastar hoje">
      <View style={styles.head}>
        <View style={styles.info}>
          <Text style={styles.label}>{over ? 'Passou do limite de hoje em' : 'Ainda pode gastar hoje'}</Text>
          <MoneyText cents={Math.abs(daily.leftTodayCents)} tone={over ? 'expense' : 'income'} style={styles.value} />
          <Text style={styles.detail}>
            Limite de hoje {formatCents(daily.todayAllowanceCents)} · gasto hoje {formatCents(daily.spentTodayCents)} ·{' '}
            {formatCents(Math.max(0, daily.freeToSpendCents))} livres até o fim do mês (
            {daily.daysLeft === 1 ? 'só hoje' : `${daily.daysLeft} dias contando hoje`}), {deductions}.
          </Text>
        </View>
      </View>
      {noRoom ? (
        <Warning text="Sem folga neste mês: as contas fixas e a meta já usam tudo o que deve entrar. Evite gastos que não sejam essenciais." />
      ) : over ? (
        <Warning text="O que passar de hoje diminui o limite dos próximos dias." />
      ) : null}
      {daily.hourValueCents > 0 ? (
        <Text style={styles.detail}>
          Sua hora de trabalho vale {formatCents(daily.hourValueCents)} (renda média ÷ {daily.workHoursPerMonth} h por mês).
        </Text>
      ) : null}
    </Card>
  );
}

function Warning({ text }: { text: string }) {
  return (
    <View style={styles.warning}>
      <FontAwesome name="exclamation-triangle" size={14} color={colors.expense} />
      <Text style={styles.warningText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md },
  info: { flex: 1, minWidth: 200 },
  label: { fontSize: fontSize.sm, color: colors.textSecondary },
  value: { fontSize: fontSize.xl, fontWeight: '700' },
  detail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    padding: spacing.sm,
    borderWidth: 1,
    borderColor: colors.expense,
    borderRadius: radius.sm,
  },
  warningText: { flex: 1, fontSize: fontSize.sm, color: colors.expense },
});
