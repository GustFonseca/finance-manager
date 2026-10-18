import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Checkbox, ListItem } from '@/components/ui';
import { colors, fontSize, radius, spacing } from '@/theme';
import { RuleDto, TYPE_LABELS } from '../types';

type Props = {
  rule: RuleDto;
  onEdit: (rule: RuleDto) => void;
  onToggle: (rule: RuleDto, isActive: boolean) => void;
};

const stopClick = (event: React.MouseEvent) => event.stopPropagation();

export function RuleListItem({ rule, onEdit, onToggle }: Props) {
  return (
    <ListItem onPress={() => onEdit(rule)} style={styles.item}>
      <View style={styles.info}>
        <View style={styles.head}>
          <Text style={styles.type}>{TYPE_LABELS[rule.type]}</Text>
          {rule.isDefault ? <Text style={styles.badge}>padrão</Text> : null}
        </View>
        <Text style={[styles.pattern, !rule.isActive && styles.inactive]} numberOfLines={2}>
          {rule.pattern}
        </Text>
        {rule.value ? <Text style={styles.value}>→ {rule.value}</Text> : null}
        {rule.note ? <Text style={styles.note}>{rule.note}</Text> : null}
      </View>
      <Text style={styles.priority}>Prioridade {rule.priority}</Text>
      <span onClick={stopClick} style={actionsStyle}>
        <Checkbox label="Ativa" checked={rule.isActive} onChange={(checked) => onToggle(rule, checked)} />
        <Button size="sm" variant="secondary" label="Editar" onPress={() => onEdit(rule)} />
      </span>
    </ListItem>
  );
}

const actionsStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: spacing.sm };

const styles = StyleSheet.create({
  item: { alignItems: 'flex-start' },
  info: { flex: 1, minWidth: 0, gap: 2 },
  head: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  type: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  badge: {
    fontSize: fontSize.xs,
    color: colors.textSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.xs,
  },
  pattern: { fontSize: fontSize.sm, color: colors.textPrimary, fontFamily: 'Consolas, "Courier New", monospace' },
  inactive: { color: colors.textMuted, textDecorationLine: 'line-through' },
  value: { fontSize: fontSize.sm, color: colors.heading },
  note: { fontSize: fontSize.xs, color: colors.textSecondary },
  priority: { width: 90, fontSize: fontSize.xs, color: colors.textMuted, textAlign: 'right' },
});
