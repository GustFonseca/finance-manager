import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Modal, MoneyText } from '@/components/ui';
import { colors, fontSize, spacing } from '@/theme';
import { formatDayTitle } from '../grid';
import { CalendarDayDto, CalendarItemKind, KIND_COLORS, KIND_LABELS } from '../types';

const OUTGOING: CalendarItemKind[] = ['EXPENSE', 'EXPECTED_BILL', 'EXPECTED_INSTALLMENT', 'SEASONAL'];

type Props = {
  day: CalendarDayDto | null;
  onClose: () => void;
};

export function DayDetail({ day, onClose }: Props) {
  return (
    <Modal visible={!!day} onClose={onClose} icon="calendar" title={day ? formatDayTitle(day.date) : ''}>
      {day && day.items.length === 0 ? <Text style={styles.empty}>Nada registrado ou previsto neste dia.</Text> : null}
      {day?.items.map((item, index) => {
        const outgoing = OUTGOING.includes(item.kind);
        return (
          <View key={`${index}-${item.name}`} style={styles.row}>
            <View style={[styles.dot, { backgroundColor: KIND_COLORS[item.kind] }]} />
            <View style={styles.info}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.kind}>{KIND_LABELS[item.kind]}</Text>
            </View>
            <MoneyText
              cents={outgoing ? -item.amountCents : item.amountCents}
              tone={outgoing ? 'expense' : 'income'}
              signed
              style={styles.value}
            />
          </View>
        );
      })}
      <View style={styles.buttons}>
        <Button label="Fechar" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  empty: { fontSize: fontSize.sm, color: colors.textSecondary, fontStyle: 'italic' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  info: { flex: 1 },
  name: { fontSize: fontSize.md, color: colors.textPrimary },
  kind: { fontSize: fontSize.xs, color: colors.textSecondary },
  value: { fontSize: fontSize.md, fontWeight: '700' },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md },
});
