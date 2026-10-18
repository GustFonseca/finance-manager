import React from 'react';
import { StyleProp, Text, TextStyle } from 'react-native';
import { colors, fontSize } from '@/theme';
import { formatCents } from '@/lib/money';

type Tone = 'income' | 'expense' | 'auto' | 'neutral';

type Props = {
  cents: number;
  signed?: boolean;
  tone?: Tone;
  style?: StyleProp<TextStyle>;
};

export function MoneyText({ cents, signed = false, tone = 'auto', style }: Props) {
  return (
    <Text style={[{ fontSize: fontSize.md }, toneColor(tone, cents), style]}>
      {formatCents(cents, { signed })}
    </Text>
  );
}

function toneColor(tone: Tone, cents: number): TextStyle {
  switch (tone) {
    case 'income':
      return { color: colors.income };
    case 'expense':
      return { color: colors.expense };
    case 'neutral':
      return {};
    default:
      return cents < 0 ? { color: colors.expense } : {};
  }
}
