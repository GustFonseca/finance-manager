import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText, ProgressBar, Select } from '@/components/ui';
import { GoalDto } from '@/features/goals/types';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { EmergencyFundDto, EmergencyFundInput } from '../types';

export const MAX_EMERGENCY_MONTHS = 24;
export const NO_GOAL = 'none';

type Props = {
  fund: EmergencyFundDto;
  goals: GoalDto[];
  onChange: (input: EmergencyFundInput) => void;
};

const monthsLabel = (months: number) => (months === 1 ? '1 mês' : `${months} meses`);

const MONTH_OPTIONS = Array.from({ length: MAX_EMERGENCY_MONTHS }, (_, i) => ({
  id: String(i + 1),
  label: monthsLabel(i + 1),
}));

function forecast(fund: EmergencyFundDto): string {
  if (fund.percent >= 100) return 'Reserva completa. Mantenha o dinheiro guardado para imprevistos.';
  if (fund.monthsToReach === null) return 'No ritmo atual não dá para prever quando a reserva fica pronta.';
  return `No ritmo atual (${formatCents(fund.averageSavedCents)} guardados por mês), a reserva fica pronta em ${monthsLabel(fund.monthsToReach)}.`;
}

export function EmergencyFundCard({ fund, goals, onChange }: Props) {
  const goalOptions = [
    { id: NO_GOAL, label: '(nenhuma meta)' },
    ...goals.filter((g) => g.status !== 'CANCELLED').map((g) => ({ id: g.id, label: g.name })),
  ];

  return (
    <Card title="Reserva de emergência">
      <Text style={styles.lead}>
        {monthsLabel(fund.months)} dos seus gastos essenciais de {formatCents(fund.monthlyEssentialCents)} por mês.
      </Text>
      <View style={styles.amounts}>
        <MoneyText cents={fund.savedCents} tone="neutral" style={styles.saved} />
        <Text style={styles.of}> de </Text>
        <MoneyText cents={fund.targetCents} tone="neutral" style={styles.of} />
      </View>
      <ProgressBar percent={fund.percent} />
      <Text style={styles.percent}>{fund.percent.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}% da reserva</Text>
      <Text style={styles.text}>
        {fund.goalName
          ? `O valor guardado vem da meta "${fund.goalName}".`
          : 'Escolha uma meta para acompanhar quanto já foi guardado.'}
      </Text>
      <Text style={styles.text}>{forecast(fund)}</Text>
      <View style={styles.controls}>
        <Select
          label="Meses de reserva:"
          options={MONTH_OPTIONS}
          selectedId={String(fund.months)}
          onSelect={(id) => onChange({ months: Number(id), goalId: fund.goalId })}
        />
        <Select
          label="Meta usada como reserva:"
          options={goalOptions}
          selectedId={fund.goalId ?? NO_GOAL}
          onSelect={(id) => onChange({ months: fund.months, goalId: id === NO_GOAL ? null : id })}
        />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  lead: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  amounts: { flexDirection: 'row', alignItems: 'baseline', marginBottom: spacing.xs },
  saved: { fontSize: fontSize.lg, fontWeight: '700' },
  of: { fontSize: fontSize.sm, color: colors.textSecondary },
  percent: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 3, marginBottom: spacing.sm },
  text: { fontSize: fontSize.sm, color: colors.textPrimary, marginBottom: spacing.xs },
  controls: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.sm },
});
