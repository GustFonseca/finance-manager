import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text, View } from 'react-native';
import { ListItem, MoneyText } from '@/components/ui';
import { colors, fontSize } from '@/theme';
import { TransactionDto } from '../types';

type Props = {
  transaction: TransactionDto;
  onPress: (transaction: TransactionDto) => void;
};

export function TransactionListItem({ transaction, onPress }: Props) {
  const isExpense = transaction.type === 'EXPENSE';
  const signedCents = isExpense ? -transaction.amountCents : transaction.amountCents;

  return (
    <ListItem onPress={() => onPress(transaction)}>
      <FontAwesome
        name={isExpense ? 'arrow-circle-down' : 'arrow-circle-up'}
        size={18}
        color={isExpense ? colors.expense : colors.income}
      />
      <View style={styles.info}>
        <Text style={styles.desc}>{transaction.description || transaction.categoryName}</Text>
        <Text style={styles.meta}>
          {new Date(transaction.date).toLocaleDateString('pt-BR')} · {transaction.categoryName} ·{' '}
          {transaction.accountName}
        </Text>
      </View>
      <MoneyText cents={signedCents} tone={isExpense ? 'expense' : 'income'} style={styles.amount} />
    </ListItem>
  );
}

const styles = StyleSheet.create({
  info: { flex: 1 },
  desc: { fontSize: fontSize.md, color: colors.textPrimary },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: fontSize.md, fontWeight: '700' },
});
