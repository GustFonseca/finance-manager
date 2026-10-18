import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Input, MonthSelect, Select, YearSelect } from '@/components/ui';
import { AccountSelect } from '@/features/accounts/components/AccountSelect';
import { useCategories } from '@/features/categories/queries';
import { MerchantSelect } from '@/features/merchants/components/MerchantSelect';
import { MonthKey } from '@/lib/periods';
import { colors, fontSize, spacing } from '@/theme';
import { TransactionType } from '../types';

export type Grouping = 'month' | 'year';

export const ALL = '';

export type FilterValues = {
  grouping: Grouping;
  monthKey: MonthKey;
  year: number;
  accountId: string;
  categoryId: string;
  type: TransactionType | typeof ALL;
  merchantId: string;
  search: string;
};

type Props = {
  values: FilterValues;
  onChange: (change: Partial<FilterValues>) => void;
};

export function TransactionFilters({ values, onChange }: Props) {
  const { data: categories = [] } = useCategories();

  return (
    <View style={styles.panel}>
      <View style={styles.row}>
        <Select
          compact
          options={[
            { id: 'month', label: 'Por mês' },
            { id: 'year', label: 'Por ano' },
          ]}
          selectedId={values.grouping}
          onSelect={(id) => onChange({ grouping: id as Grouping })}
        />
        {values.grouping === 'month' ? (
          <MonthSelect value={values.monthKey} onChange={(monthKey) => onChange({ monthKey })} />
        ) : (
          <YearSelect value={values.year} onChange={(year) => onChange({ year })} />
        )}
        <AccountSelect value={values.accountId} onChange={(accountId) => onChange({ accountId })} />
        <MerchantSelect value={values.merchantId} onChange={(merchantId) => onChange({ merchantId })} />
      </View>
      <View style={styles.row}>
        <View style={styles.field}>
          <Text style={styles.label}>Categoria:</Text>
          <Select
            compact
            options={[{ id: ALL, label: 'Todas' }, ...categories.map((c) => ({ id: c.id, label: c.name }))]}
            selectedId={values.categoryId}
            onSelect={(categoryId) => onChange({ categoryId })}
          />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>Tipo:</Text>
          <Select
            compact
            options={[
              { id: ALL, label: 'Todos' },
              { id: 'EXPENSE', label: 'Despesas' },
              { id: 'INCOME', label: 'Receitas' },
            ]}
            selectedId={values.type}
            onSelect={(type) => onChange({ type: type as FilterValues['type'] })}
          />
        </View>
        <View style={styles.search}>
          <Input
            placeholder="Procurar por descrição ou estabelecimento..."
            value={values.search}
            onChangeText={(search) => onChange({ search })}
            accessibilityLabel="Procurar transações"
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { padding: spacing.sm, gap: spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.divider },
  row: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.md },
  field: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  label: { fontSize: fontSize.sm, color: colors.textPrimary },
  search: { flexGrow: 1, minWidth: 220, marginBottom: -spacing.md },
});
