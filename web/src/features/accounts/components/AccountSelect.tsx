import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Select } from '@/components/ui';
import { colors, fontSize, spacing } from '@/theme';
import { useAccounts } from '../queries';

export const ALL_ACCOUNTS = '';

type Props = {
  value: string;
  onChange: (accountId: string) => void;
};

export function AccountSelect({ value, onChange }: Props) {
  const { data: accounts = [] } = useAccounts();

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Conta:</Text>
      <Select
        compact
        options={[
          { id: ALL_ACCOUNTS, label: 'Todas as contas' },
          ...accounts.map((account) => ({ id: account.id, label: account.name })),
        ]}
        selectedId={value}
        onSelect={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { fontSize: fontSize.sm, color: colors.textPrimary },
});
