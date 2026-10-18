import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Select } from '@/components/ui';
import { colors, fontSize, spacing } from '@/theme';
import { useMerchants } from '../queries';

export const ALL_MERCHANTS = '';

type Props = {
  value: string;
  onChange: (merchantId: string) => void;
};

export function MerchantSelect({ value, onChange }: Props) {
  const { data: merchants = [] } = useMerchants();

  return (
    <View style={styles.row}>
      <Text style={styles.label}>Estabelecimento:</Text>
      <Select
        compact
        options={[
          { id: ALL_MERCHANTS, label: 'Todos' },
          ...merchants.map((merchant) => ({ id: merchant.id, label: merchant.name })),
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
