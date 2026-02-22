import React from 'react';
import { Text, TextStyle, StyleProp } from 'react-native';

type Props = {
  amountCents: number;
  style?: StyleProp<TextStyle>;
  showSign?: boolean;
};

export function MoneyDisplay({ amountCents, style, showSign = false }: Props) {
  const value = amountCents / 100;
  const sign = showSign && amountCents > 0 ? '+' : '';
  const formatted = `${sign}R$ ${Math.abs(value).toFixed(2).replace('.', ',')}`;

  return (
    <Text style={[{ fontSize: 16 }, amountCents < 0 && { color: '#F44336' }, style]}>
      {amountCents < 0 ? `- R$ ${Math.abs(value).toFixed(2).replace('.', ',')}` : formatted}
    </Text>
  );
}
