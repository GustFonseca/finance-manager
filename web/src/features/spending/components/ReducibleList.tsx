import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { classInfo } from '../classes';
import { ReducibleExpenseDto } from '../types';

export function ReducibleList({ items }: { items: ReducibleExpenseDto[] }) {
  if (items.length === 0) {
    return (
      <Text style={styles.empty}>
        Nenhum gasto supérfluo ou variável relevante. As sugestões aparecem quando um hábito passa de R$ 50 por mês.
      </Text>
    );
  }
  return (
    <View>
      {items.map((item) => {
        const info = classInfo(item.class);
        return (
          <View key={item.name} style={styles.row}>
            <View style={[styles.swatch, { backgroundColor: info.color }]} />
            <View style={styles.info}>
              <Text style={styles.name}>
                {item.name} <Text style={styles.kind}>· {info.label}</Text>
              </Text>
              <Text style={styles.detail}>{item.detail}</Text>
            </View>
            <Text style={styles.savings}>{formatCents(item.potentialCents)}/mês</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textSecondary, fontStyle: 'italic', fontSize: fontSize.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  swatch: { width: 10, height: 10, borderRadius: 2, marginTop: 4 },
  info: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  kind: { fontSize: fontSize.sm, fontWeight: '400', color: colors.textSecondary },
  detail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },
  savings: { fontSize: fontSize.md, fontWeight: '700', color: colors.income },
});
