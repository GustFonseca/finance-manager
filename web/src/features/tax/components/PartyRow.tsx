import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { MoneyText } from '@/components/ui';
import { colors, fontSize, spacing } from '@/theme';
import { formatDocument } from '../summary';
import { TaxParty } from '../types';

export function PartyRow({ party }: { party: TaxParty }) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.name}>{party.name}</Text>
        <Text style={[styles.meta, !party.document && styles.missing]}>
          {formatDocument(party.document)} · {party.count} lançamento(s)
        </Text>
      </View>
      <MoneyText cents={party.cents} tone="neutral" style={styles.value} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  info: { flex: 1 },
  name: { fontSize: fontSize.md, color: colors.textPrimary },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  missing: { color: colors.expense },
  value: { fontSize: fontSize.md, fontWeight: '700' },
});
