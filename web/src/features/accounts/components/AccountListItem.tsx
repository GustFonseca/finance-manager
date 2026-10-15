import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { StyleSheet, Text } from 'react-native';
import { ListItem, MoneyText } from '@/components/ui';
import { colors, fontSize } from '@/theme';
import { AccountDto } from '../types';

type Props = {
  account: AccountDto;
  onPress: (account: AccountDto) => void;
};

export function AccountListItem({ account, onPress }: Props) {
  return (
    <ListItem onPress={() => onPress(account)}>
      <FontAwesome name="bank" size={18} color="#6D4C41" />
      <Text style={styles.name}>{account.name}</Text>
      <MoneyText cents={account.balanceCents} style={styles.balance} />
    </ListItem>
  );
}

const styles = StyleSheet.create({
  name: { flex: 1, fontSize: fontSize.md, color: colors.textPrimary },
  balance: { fontSize: fontSize.md },
});
