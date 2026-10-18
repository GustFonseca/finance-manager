import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { classInfo } from '../classes';
import { MerchantSpendingDto } from '../types';

export function TopMerchants({ merchants }: { merchants: MerchantSpendingDto[] }) {
  if (merchants.length === 0) {
    return <Text style={styles.empty}>Nenhuma despesa neste mês.</Text>;
  }
  return (
    <View>
      <View style={[styles.row, styles.header]}>
        <Text style={[styles.name, styles.th]}>Estabelecimento</Text>
        <Text style={[styles.kind, styles.th]}>Tipo</Text>
        <Text style={[styles.count, styles.th]}>Vezes</Text>
        <Text style={[styles.total, styles.th]}>Total</Text>
      </View>
      {merchants.map((merchant) => {
        const info = classInfo(merchant.class);
        return (
          <View key={merchant.name} style={styles.row}>
            <View style={styles.name}>
              <Text style={styles.td} numberOfLines={1}>
                {merchant.name}
              </Text>
              <Text style={styles.meta}>{merchant.categoryName}</Text>
            </View>
            <View style={[styles.kind, styles.kindCell]}>
              <View style={[styles.swatch, { backgroundColor: info.color }]} />
              <Text style={styles.td}>{info.label}</Text>
            </View>
            <Text style={[styles.count, styles.td]}>{merchant.count}</Text>
            <Text style={[styles.total, styles.td, styles.bold]}>{formatCents(merchant.cents)}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { color: colors.textSecondary, fontStyle: 'italic', fontSize: fontSize.sm },
  header: { backgroundColor: colors.surfaceLight },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 4,
    paddingHorizontal: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  th: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textPrimary },
  td: { fontSize: fontSize.sm, color: colors.textPrimary },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary },
  bold: { fontWeight: '700' },
  name: { flex: 1, minWidth: 0 },
  kind: { width: 100 },
  kindCell: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  swatch: { width: 10, height: 10, borderRadius: 2 },
  count: { width: 50, textAlign: 'right' },
  total: { width: 110, textAlign: 'right' },
});
