import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText } from '@/components/ui';
import { colors, spacing, fontSize } from '@/theme';
import { TransactionDto } from '../types';

type Props = {
  transaction: TransactionDto;
  onPress: (transaction: TransactionDto) => void;
};

export function TransactionListItem({ transaction, onPress }: Props) {
  const signedCents =
    transaction.type === 'EXPENSE' ? -transaction.amountCents : transaction.amountCents;

  return (
    <Pressable onPress={() => onPress(transaction)}>
      <Card style={styles.card}>
        <View style={styles.info}>
          <Text style={styles.desc}>{transaction.description || transaction.categoryName}</Text>
          <Text style={styles.meta}>
            {new Date(transaction.date).toLocaleDateString('pt-BR')} · {transaction.categoryName} ·{' '}
            {transaction.accountName}
          </Text>
        </View>
        <MoneyText
          cents={signedCents}
          tone={transaction.type === 'EXPENSE' ? 'expense' : 'income'}
          style={styles.amount}
        />
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md + 2,
    marginBottom: spacing.sm,
  },
  info: { flex: 1, marginRight: spacing.md },
  desc: { fontSize: fontSize.sm + 1, fontWeight: '500', color: colors.textPrimary },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 3 },
  amount: { fontSize: fontSize.md, fontWeight: '600' },
});
