import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui';
import { colors, fontSize, spacing } from '@/theme';

export type RowAction = { label: string; onPress: () => void };

type Props = {
  title: string;
  detail: string;
  value: string;
  highlight?: string;
  actions?: RowAction[];
};

export function AvoidableRow({ title, detail, value, highlight, actions = [] }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.detail}>{detail}</Text>
        {highlight ? <Text style={styles.highlight}>{highlight}</Text> : null}
        {actions.length > 0 ? (
          <View style={styles.actions}>
            {actions.map((action) => (
              <Button key={action.label} size="sm" variant="secondary" label={action.label} onPress={action.onPress} />
            ))}
          </View>
        ) : null}
      </View>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  info: { flex: 1, minWidth: 0, gap: 2 },
  title: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  detail: { fontSize: fontSize.sm, color: colors.textSecondary },
  highlight: { fontSize: fontSize.sm, color: colors.expense, fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  value: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary, textAlign: 'right' },
});
