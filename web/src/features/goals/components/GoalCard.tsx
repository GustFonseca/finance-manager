import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, MoneyText, ProgressBar } from '@/components/ui';
import { colors, spacing, fontSize } from '@/theme';
import { GoalDto } from '../types';

type Props = {
  goal: GoalDto;
  onAddProgress: (goal: GoalDto) => void;
  onComplete: (goal: GoalDto) => void;
  onDelete: (goal: GoalDto) => void;
};

export function GoalCard({ goal, onAddProgress, onComplete, onDelete }: Props) {
  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.name}>{goal.name}</Text>
        <Text style={[styles.status, goal.status === 'COMPLETED' && styles.completed]}>
          {goal.status}
        </Text>
      </View>

      <View style={styles.progress}>
        <ProgressBar percent={goal.progressPercent} />
      </View>
      <Text style={styles.progressText}>{goal.progressPercent.toFixed(1)}%</Text>

      <View style={styles.amounts}>
        <MoneyText cents={goal.currentCents} tone="neutral" style={styles.current} />
        <Text style={styles.separator}> / </Text>
        <MoneyText cents={goal.targetCents} tone="neutral" style={styles.target} />
      </View>

      {goal.deadline ? (
        <Text style={styles.deadline}>
          Prazo: {new Date(goal.deadline).toLocaleDateString('pt-BR')}
        </Text>
      ) : null}

      {goal.status === 'ACTIVE' && (
        <View style={styles.actions}>
          <Button label="Adicionar" size="sm" onPress={() => onAddProgress(goal)} style={styles.grow} />
          <Button
            label="Concluir"
            size="sm"
            variant="success"
            onPress={() => onComplete(goal)}
            style={styles.grow}
          />
          <Button
            label="Remover"
            size="sm"
            variant="danger"
            onPress={() => onDelete(goal)}
            style={styles.grow}
          />
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: fontSize.lg, fontWeight: '600', color: colors.textPrimary },
  status: { fontSize: fontSize.xs, color: colors.textSecondary, textTransform: 'uppercase' },
  completed: { color: colors.income },
  progress: { marginTop: spacing.md },
  progressText: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs, textAlign: 'right' },
  amounts: { flexDirection: 'row', alignItems: 'center', marginTop: spacing.sm },
  current: { fontSize: fontSize.sm, fontWeight: '600', color: colors.textPrimary },
  separator: { color: colors.textSecondary },
  target: { fontSize: fontSize.sm, color: colors.textSecondary },
  deadline: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: spacing.xs },
  actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  grow: { flex: 1 },
});
