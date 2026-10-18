import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCentsCompact } from '@/lib/money';
import { colors, fontSize, PressState, spacing, webStyle } from '@/theme';
import { CalendarCell, kindsOf } from '../grid';
import { CalendarDayDto, KIND_COLORS, KIND_LABELS } from '../types';

type Props = {
  cell: CalendarCell;
  today: boolean;
  onOpen: (day: CalendarDayDto) => void;
};

export function DayCell({ cell, today, onOpen }: Props) {
  if (!cell) return <View style={[styles.cell, styles.blank]} />;
  const { day, data } = cell;
  const number = <Text style={[styles.number, today && styles.todayNumber]}>{day}</Text>;
  if (!data) return <View style={[styles.cell, today && styles.today]}>{number}</View>;
  const kinds = kindsOf(data);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Dia ${day}`}
      onPress={() => onOpen(data)}
      style={(state) => [styles.cell, styles.clickable, today && styles.today, (state as PressState).hovered && styles.hovered]}>
      {number}
      {data.expenseCents > 0 ? <Text style={[styles.amount, styles.expense]}>-{formatCentsCompact(data.expenseCents)}</Text> : null}
      {data.incomeCents > 0 ? <Text style={[styles.amount, styles.income]}>+{formatCentsCompact(data.incomeCents)}</Text> : null}
      {data.expectedOutCents > 0 ? <Text style={styles.expected}>prev. -{formatCentsCompact(data.expectedOutCents)}</Text> : null}
      {data.expectedInCents > 0 ? <Text style={styles.expected}>prev. +{formatCentsCompact(data.expectedInCents)}</Text> : null}
      <View style={styles.dots}>
        {kinds.map((kind) => (
          <View key={kind} accessibilityLabel={KIND_LABELS[kind]} style={[styles.dot, { backgroundColor: KIND_COLORS[kind] }]} />
        ))}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    width: `${100 / 7}%`,
    minHeight: 72,
    padding: 3,
    backgroundColor: colors.surface,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.divider,
    gap: 1,
  },
  clickable: webStyle({ cursor: 'pointer' }),
  blank: { backgroundColor: colors.surfaceLight },
  today: { backgroundColor: '#FFFFE1' },
  hovered: { backgroundColor: colors.hover },
  number: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: 1 },
  todayNumber: { color: colors.heading, fontWeight: '700' },
  amount: { fontSize: fontSize.xs, fontWeight: '700' },
  expense: { color: colors.expense },
  income: { color: colors.income },
  expected: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic' },
  dots: { flexDirection: 'row', flexWrap: 'wrap', gap: 2, marginTop: spacing.xs },
  dot: { width: 7, height: 7, borderRadius: 4 },
});
