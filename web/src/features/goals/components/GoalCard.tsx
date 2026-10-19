import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, MoneyText, ProgressBar } from '@/components/ui';
import { colors, spacing, fontSize } from '@/theme';
import { GoalDto, GoalStatus } from '../types';
import { formatDay } from '@/lib/periods';

type Props = {
  goal: GoalDto;
  onAddProgress: (goal: GoalDto) => void;
  onComplete: (goal: GoalDto) => void;
  onDelete: (goal: GoalDto) => void;
};

const STATUS_LABELS: Record<GoalStatus, string> = {
  ACTIVE: 'Ativa',
  COMPLETED: 'Concluída',
  CANCELLED: 'Cancelada',
};

export function GoalCard({ goal, onAddProgress, onComplete, onDelete }: Props) {
  return (
    <Card title={goal.name} style={styles.card}>
      <View style={styles.header}>
        <View style={styles.amounts}>
          <MoneyText cents={goal.currentCents} tone="neutral" style={styles.current} />
          <Text style={styles.separator}> de </Text>
          <MoneyText cents={goal.targetCents} tone="neutral" style={styles.target} />
        </View>
        <Text style={[styles.status, goal.status === 'COMPLETED' && styles.completed]}>
          {STATUS_LABELS[goal.status]}
        </Text>
      </View>

      <View style={styles.progress}>
        <ProgressBar percent={goal.progressPercent} />
        <Text style={styles.progressText}>{goal.progressPercent.toFixed(1)}% concluído</Text>
      </View>

      {goal.deadline ? (
        <Text style={styles.deadline}>
          Prazo: {formatDay(goal.deadline)}
        </Text>
      ) : null}

      {goal.status === 'ACTIVE' && (
        <View style={styles.actions}>
          <Button label="Adicionar..." onPress={() => onAddProgress(goal)} />
          <Button label="Concluir" variant="success" onPress={() => onComplete(goal)} />
          <Button label="Remover" variant="danger" onPress={() => onDelete(goal)} />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  amounts: { flexDirection: 'row', alignItems: 'baseline' },
  current: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  separator: { fontSize: fontSize.sm, color: colors.textSecondary },
  target: { fontSize: fontSize.sm, color: colors.textSecondary },
  status: { fontSize: fontSize.sm, color: colors.textSecondary },
  completed: { color: colors.income, fontWeight: '700' },
  progress: { marginTop: spacing.sm },
  progressText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: 3 },
  deadline: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
