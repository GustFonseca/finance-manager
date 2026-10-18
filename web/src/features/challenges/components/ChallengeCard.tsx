import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Card, MoneyText, ProgressBar } from '@/components/ui';
import { formatCents } from '@/lib/money';
import { colors, fontSize, palette, spacing } from '@/theme';
import { ChallengeDto, ChallengeStatus } from '../types';

const STATUS: Record<ChallengeStatus, { label: string; color: string }> = {
  ACTIVE: { label: 'Em andamento', color: palette.navy },
  WON: { label: 'Concluído', color: colors.income },
  LOST: { label: 'Limite estourado', color: colors.expense },
};

const date = (iso: string) => new Date(iso).toLocaleDateString('pt-BR');

type Props = {
  challenge: ChallengeDto;
  onDelete: (challenge: ChallengeDto) => void;
};

export function ChallengeCard({ challenge: c, onDelete }: Props) {
  const status = STATUS[c.status];
  const limit = c.limitCents > 0 ? `limite de ${formatCents(c.limitCents)}` : 'meta: não gastar nada';

  return (
    <Card title={c.name} style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.meta}>
          {c.targetName} · {c.daysElapsed} de {c.days} dias · até {date(c.endsOn)}
        </Text>
        <Text style={[styles.status, { color: status.color }]}>{status.label}</Text>
      </View>
      <ProgressBar percent={(c.daysElapsed / c.days) * 100} />
      <View style={styles.figures}>
        <View>
          <Text style={styles.figureLabel}>Gasto no desafio ({limit})</Text>
          <MoneyText cents={c.spentCents} tone={c.status === 'LOST' ? 'expense' : 'neutral'} style={styles.figureValue} />
        </View>
        <View>
          <Text style={styles.figureLabel}>Economia estimada</Text>
          <MoneyText cents={c.savedCents} tone="income" style={styles.figureValue} />
        </View>
      </View>
      <Text style={styles.hint}>
        No seu ritmo dos 90 dias anteriores, você teria gasto {formatCents(c.baselineCents)}{' '}
        {c.daysElapsed === 1 ? 'no primeiro dia' : `nesses ${c.daysElapsed} dias`}.
      </Text>
      <View style={styles.actions}>
        <Button label="Remover" variant="danger" onPress={() => onDelete(c)} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  header: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.xs },
  meta: { fontSize: fontSize.sm, color: colors.textSecondary },
  status: { fontSize: fontSize.sm, fontWeight: '700' },
  figures: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, marginTop: spacing.sm },
  figureLabel: { fontSize: fontSize.xs, color: colors.textSecondary },
  figureValue: { fontSize: fontSize.lg, fontWeight: '700' },
  hint: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.xs },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.sm },
});
