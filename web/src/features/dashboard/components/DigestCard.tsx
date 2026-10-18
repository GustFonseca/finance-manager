import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Card, ProgressBar, RadioGroup } from '@/components/ui';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { DigestDto } from '../types';

type Range = 'week' | 'month';

export const MAX_DIGEST_GOALS = 3;

const RANGES = [
  { value: 'week' as const, label: 'Semana' },
  { value: 'month' as const, label: 'Mês' },
];

const COMPARED_TO: Record<Range, string> = {
  week: 'em relação à semana anterior',
  month: 'em relação ao mesmo período do mês anterior',
};

function changeOf(percent: number) {
  return `${percent < 0 ? '−' : '+'}${Math.abs(Math.round(percent))}%`;
}

export function DigestCard({ digest }: { digest: DigestDto }) {
  const [range, setRange] = useState<Range>('week');

  if (digest.week.spentCents === 0 && digest.month.spentCents === 0 && digest.goals.length === 0) return null;

  const period = digest[range];
  const goals = digest.goals.slice(0, MAX_DIGEST_GOALS);

  return (
    <Card title="Resumo">
      <RadioGroup options={RANGES} value={range} onChange={setRange} />
      <Text style={styles.headline}>Você gastou {formatCents(period.spentCents)}</Text>
      {period.changePercent !== null ? (
        <Text style={[styles.detail, { color: period.changePercent > 0 ? colors.expense : colors.income }]}>
          {changeOf(period.changePercent)} {COMPARED_TO[range]}
        </Text>
      ) : null}
      <Text style={styles.line}>
        Entrou {formatCents(period.incomeCents)} ·{' '}
        {period.savedCents < 0 ? `faltou ${formatCents(-period.savedCents)}` : `sobrou ${formatCents(period.savedCents)}`}
      </Text>
      {period.superfluousCents > 0 ? (
        <Text style={styles.line}>{formatCents(period.superfluousCents)} em supérfluos</Text>
      ) : null}
      {period.topMerchant ? (
        <Text style={styles.line}>
          Maior gasto: {period.topMerchant.name} ({formatCents(period.topMerchant.cents)})
        </Text>
      ) : null}
      {period.topIncrease ? (
        <Text style={styles.line}>
          Maior aumento: {period.topIncrease.name}, {formatCents(period.topIncrease.cents)} (antes{' '}
          {formatCents(period.topIncrease.previousCents)})
        </Text>
      ) : null}
      {goals.length > 0 ? (
        <View style={styles.goals}>
          {goals.map((goal) => (
            <View key={goal.name} style={styles.goalRow}>
              <Text style={styles.goalName} numberOfLines={1}>
                {goal.name}
              </Text>
              <View style={styles.goalBar}>
                <ProgressBar percent={goal.percent} height={12} />
              </View>
              <Text style={styles.goalMissing}>faltam {formatCents(goal.missingCents)}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  headline: { fontSize: fontSize.xl, fontWeight: '700', color: colors.textPrimary },
  detail: { fontSize: fontSize.sm, marginBottom: spacing.xs },
  line: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  goals: { marginTop: spacing.sm, gap: spacing.xs },
  goalRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  goalName: { width: 120, fontSize: fontSize.sm, color: colors.textPrimary },
  goalBar: { flex: 1 },
  goalMissing: { width: 130, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right' },
});
