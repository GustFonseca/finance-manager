import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ListItem, MoneyText } from '@/components/ui';
import { colors, fontSize, spacing, webStyle } from '@/theme';
import { TransactionDto } from '../types';
import { formatDay } from '@/lib/periods';

type Props = {
  transaction: TransactionDto;
  onPress: (transaction: TransactionDto) => void;
  onOpenReceipt: (transaction: TransactionDto) => void;
};

export function TransactionListItem({ transaction, onPress, onOpenReceipt }: Props) {
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
        <Text style={styles.desc}>
          {transaction.merchantName || transaction.description || transaction.categoryName}
        </Text>
        <Text style={styles.meta}>
          {formatDay(transaction.date)} · {transaction.categoryName} ·{' '}
          {transaction.accountName}
        </Text>
        {transaction.merchantName ? (
          <Text style={styles.meta} numberOfLines={1}>
            {transaction.description}
          </Text>
        ) : null}
      </View>
      {transaction.receiptFileId ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Abrir comprovante"
          onPress={() => onOpenReceipt(transaction)}
          style={styles.receipt}>
          <FontAwesome name="paperclip" size={16} color={colors.textSecondary} />
        </Pressable>
      ) : null}
      <MoneyText cents={signedCents} tone={isExpense ? 'expense' : 'income'} style={styles.amount} />
    </ListItem>
  );
}

const styles = StyleSheet.create({
  info: { flex: 1 },
  desc: { fontSize: fontSize.md, color: colors.textPrimary },
  meta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: fontSize.md, fontWeight: '700' },
  receipt: { padding: spacing.xs, ...webStyle({ cursor: 'pointer' }) },
});
