import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Card, MoneyText } from '@/components/ui';
import { colors, spacing, fontSize } from '@/theme';
import { AccountDto } from '../types';

type Props = {
  account: AccountDto;
  onPress: (account: AccountDto) => void;
};

export function AccountListItem({ account, onPress }: Props) {
  return (
    <Pressable onPress={() => onPress(account)}>
      <Card style={styles.card}>
        <View style={styles.info}>
          <Text style={styles.name}>{account.name}</Text>
          <MoneyText cents={account.balanceCents} style={styles.balance} />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md + 2, marginBottom: spacing.sm },
  info: { flex: 1 },
  name: { fontSize: fontSize.md, fontWeight: '500', color: colors.textPrimary },
  balance: { fontSize: fontSize.sm, marginTop: spacing.xs },
});
