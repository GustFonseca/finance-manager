import React from 'react';
import { View } from 'react-native';
import { ChartLegend, StackedBar } from '@/components/ui';
import { formatCents } from '@/lib/money';
import { SPENDING_CLASSES } from '../classes';
import { SpendingClassTotalDto } from '../types';

/** Essential / variable / superfluous as one 100% bar, with every value in the legend. */
export function ClassSplit({ totals }: { totals: SpendingClassTotalDto[] }) {
  const byClass = (c: string) => totals.find((t) => t.class === c);
  return (
    <View>
      <StackedBar
        segments={SPENDING_CLASSES.map((c) => ({ key: c.class, value: byClass(c.class)?.cents ?? 0, color: c.color }))}
      />
      <ChartLegend
        items={SPENDING_CLASSES.map((c) => {
          const total = byClass(c.class);
          return {
            label: c.label,
            color: c.color,
            value: `${formatCents(total?.cents ?? 0)} · ${Math.round((total?.share ?? 0) * 100)}%`,
          };
        })}
      />
    </View>
  );
}
