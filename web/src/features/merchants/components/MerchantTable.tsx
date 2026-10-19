import React, { useCallback, useMemo } from 'react';
import { FlatList, ListRenderItemInfo, StyleSheet, Text, View } from 'react-native';
import { BarTrack, ChartLegend, ListItem } from '@/components/ui';
import { classInfo, SPENDING_CLASSES } from '@/features/spending/classes';
import { formatCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { kindLabel, MerchantSpendingDto } from '../types';

const INITIAL_ROWS = 20;
const LIST_MAX_HEIGHT = 520;

type Props = {
  merchants: MerchantSpendingDto[];
  onOpen: (merchant: MerchantSpendingDto) => void;
};

const keyOf = (merchant: MerchantSpendingDto) => merchant.merchantId ?? merchant.name;

export const MerchantTable = React.memo(function MerchantTable({ merchants, onOpen }: Props) {
  const max = useMemo(() => Math.max(1, ...merchants.map((m) => m.cents)), [merchants]);
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<MerchantSpendingDto>) => <MerchantRow merchant={item} max={max} onOpen={onOpen} />,
    [max, onOpen]
  );

  if (merchants.length === 0) {
    return <Text style={styles.empty}>Nenhum gasto encontrado neste período.</Text>;
  }

  return (
    <View>
      <View style={styles.legend}>
        <ChartLegend items={SPENDING_CLASSES.map((c) => ({ label: c.label, color: c.color }))} />
      </View>
      <View style={[styles.row, styles.header]}>
        <Text style={[styles.colName, styles.th]}>Estabelecimento</Text>
        <Text style={[styles.colCount, styles.th]}>Compras</Text>
        <Text style={[styles.colValue, styles.th]}>Ticket médio</Text>
        <Text style={[styles.colTotal, styles.th]}>Total</Text>
      </View>
      <FlatList
        data={merchants}
        keyExtractor={keyOf}
        renderItem={renderItem}
        initialNumToRender={INITIAL_ROWS}
        windowSize={5}
        style={styles.list}
      />
    </View>
  );
});

const MerchantRow = React.memo(function MerchantRow({
  merchant,
  max,
  onOpen,
}: {
  merchant: MerchantSpendingDto;
  max: number;
  onOpen: (merchant: MerchantSpendingDto) => void;
}) {
  return (
    <ListItem onPress={() => merchant.merchantId && onOpen(merchant)} style={styles.item}>
      <View style={styles.row}>
        <View style={styles.colName}>
          <Text style={styles.td} numberOfLines={1}>
            {merchant.name}
          </Text>
          <Text style={styles.meta} numberOfLines={1}>
            {[merchant.categoryName, merchant.kind !== 'BUSINESS' ? kindLabel(merchant.kind) : null]
              .filter(Boolean)
              .join(' · ')}
          </Text>
        </View>
        <Text style={[styles.colCount, styles.td]}>{merchant.count}</Text>
        <Text style={[styles.colValue, styles.td]}>{formatCents(merchant.averageTicketCents)}</Text>
        <View style={styles.colTotal}>
          <Text style={[styles.td, styles.bold, styles.right]}>{formatCents(merchant.cents)}</Text>
          <Text style={[styles.meta, styles.right]}>{Math.round(merchant.share * 100)}%</Text>
        </View>
      </View>
      <BarTrack ratio={merchant.cents / max} color={classInfo(merchant.class).color} thickness={8} />
    </ListItem>
  );
});

const styles = StyleSheet.create({
  empty: { color: colors.textSecondary, fontStyle: 'italic', fontSize: fontSize.sm },
  legend: { marginBottom: spacing.sm },
  list: { maxHeight: LIST_MAX_HEIGHT },
  header: {
    backgroundColor: colors.surfaceLight,
    paddingVertical: 4,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  item: { flexDirection: 'column', alignItems: 'stretch', gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  th: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textPrimary },
  td: { fontSize: fontSize.sm, color: colors.textPrimary },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary },
  bold: { fontWeight: '700' },
  right: { textAlign: 'right' },
  colName: { flex: 1, minWidth: 0 },
  colCount: { width: 60, textAlign: 'right' },
  colValue: { width: 90, textAlign: 'right' },
  colTotal: { width: 100, alignItems: 'flex-end' },
});
