import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { chart, colors, fontSize, PressState, radius, spacing, webStyle } from '@/theme';
import type { BarSegment } from './StackedBar';

export type ChartColumn = {
  key: string;
  label: string;
  segments: BarSegment[];
  details: string[];
};

type Props = {
  columns: ChartColumn[];
  formatValue: (value: number) => string;
  height?: number;
};

const COLUMN_WIDTH = 24;

export function ColumnChart({ columns, formatValue, height = 160 }: Props) {
  const total = (c: ChartColumn) => c.segments.reduce((sum, s) => sum + s.value, 0);
  const max = Math.max(1, ...columns.map(total));

  return (
    <View style={styles.chart}>
      <View style={[styles.axis, { height }]}>
        <Text style={styles.axisLabel}>{formatValue(max)}</Text>
        <Text style={styles.axisLabel}>{formatValue(max / 2)}</Text>
        <Text style={styles.axisLabel}>{formatValue(0)}</Text>
      </View>
      <View style={styles.plotArea}>
        <View style={[styles.plot, { height }]}>
          {[0, 0.5, 1].map((at) => (
            <View key={at} style={[styles.gridline, { bottom: at * height }]} />
          ))}
          {columns.map((column, index) => {
            const isLast = index === columns.length - 1;
            const visible = column.segments.filter((s) => s.value > 0);
            return (
              <Pressable
                key={column.key}
                accessibilityLabel={`${column.label}: ${column.details.join(', ')}`}
                style={styles.slot}>
                {(state) => (
                  <>
                    {isLast && total(column) > 0 ? (
                      <Text style={[styles.directLabel, { bottom: (total(column) / max) * height + 4 }]}>
                        {formatValue(total(column))}
                      </Text>
                    ) : null}
                    <View style={styles.stack}>
                      {visible.map(({ key, value: size, color }, i) => (
                        <View
                          key={key}
                          style={[
                            { height: (size / max) * height, backgroundColor: color },
                            i > 0 && styles.segmentGap,
                            i === visible.length - 1 && styles.top,
                          ]}
                        />
                      ))}
                    </View>
                    {(state as PressState).hovered ? (
                      <View style={[styles.tooltip, index > columns.length / 2 ? styles.tooltipLeft : styles.tooltipRight]}>
                        <Text style={styles.tooltipTitle}>{column.label}</Text>
                        {column.details.map((line) => (
                          <Text key={line} style={styles.tooltipLine}>
                            {line}
                          </Text>
                        ))}
                      </View>
                    ) : null}
                  </>
                )}
              </Pressable>
            );
          })}
        </View>
        <View style={styles.labels}>
          {columns.map((column) => (
            <Text key={column.key} style={styles.columnLabel}>
              {column.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', gap: spacing.sm },
  axis: { justifyContent: 'space-between', alignItems: 'flex-end', marginTop: -6, marginBottom: -6 },
  axisLabel: { fontSize: fontSize.xs, color: colors.textMuted },
  plotArea: { flex: 1 },
  plot: { flexDirection: 'row', alignItems: 'flex-end', position: 'relative' },
  gridline: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: chart.grid },
  slot: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'flex-end', ...webStyle({ cursor: 'default' }) },
  stack: { width: COLUMN_WIDTH, flexDirection: 'column-reverse' },
  segmentGap: { borderBottomWidth: 2, borderBottomColor: chart.surface },
  top: { borderTopLeftRadius: 4, borderTopRightRadius: 4 },
  directLabel: { position: 'absolute', fontSize: fontSize.xs, fontWeight: '700', color: colors.textPrimary },
  tooltip: {
    position: 'absolute',
    top: 0,
    zIndex: 10,
    minWidth: 170,
    padding: spacing.sm,
    backgroundColor: '#FFFFE1',
    borderWidth: 1,
    borderColor: colors.textPrimary,
    borderRadius: radius.sm,
    ...webStyle({ boxShadow: '2px 2px 3px rgba(0,0,0,0.25)' }),
  },
  tooltipRight: { left: '55%' },
  tooltipLeft: { right: '55%' },
  tooltipTitle: { fontSize: fontSize.sm, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  tooltipLine: { fontSize: fontSize.xs, color: colors.textPrimary },
  labels: { flexDirection: 'row', marginTop: spacing.xs },
  columnLabel: { flex: 1, textAlign: 'center', fontSize: fontSize.xs, color: colors.textSecondary },
});
