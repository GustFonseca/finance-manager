import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Checkbox, DialogButtons, Input, Modal, RadioGroup, Select } from '@/components/ui';
import { useCategories } from '@/features/categories/queries';
import { SPENDING_CLASSES } from '@/features/spending/classes';
import { SpendingClass } from '@/features/spending/types';
import { colors, fontSize, spacing } from '@/theme';
import { MERCHANT_KINDS, MerchantDto, MerchantKind, UpdateMerchantInput } from '../types';

const NO_CATEGORY = '';
const AUTOMATIC = '';

type Props = {
  merchant: MerchantDto | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (data: UpdateMerchantInput) => void;
};

export function MerchantForm({ merchant, saving, onClose, onSubmit }: Props) {
  const { data: categories = [] } = useCategories();
  const [name, setName] = useState('');
  const [kind, setKind] = useState<MerchantKind>('BUSINESS');
  const [categoryId, setCategoryId] = useState(NO_CATEGORY);
  const [apply, setApply] = useState(true);
  const [spendingClass, setSpendingClass] = useState(AUTOMATIC);

  useEffect(() => {
    if (!merchant) return;
    setName(merchant.name);
    setKind(merchant.kind);
    setCategoryId(merchant.categoryId ?? NO_CATEGORY);
    setApply(true);
    setSpendingClass(merchant.class ?? AUTOMATIC);
  }, [merchant]);

  function handleSubmit() {
    const trimmed = name.trim();
    if (!trimmed) return;
    onSubmit({
      name: trimmed,
      kind,
      categoryId: categoryId || null,
      applyToTransactions: apply && !!categoryId,
      class: (spendingClass || null) === merchant?.class ? undefined : ((spendingClass || null) as SpendingClass | null),
    });
  }

  return (
    <Modal visible={!!merchant} onClose={onClose} icon="shopping-cart" title="Editar estabelecimento">
      <Input label="Nome:" value={name} onChangeText={setName} />
      <Text style={styles.label}>Tipo:</Text>
      <RadioGroup value={kind} onChange={setKind} options={MERCHANT_KINDS} />
      {kind === 'OWN' ? (
        <Text style={styles.hint}>
          Movimentações entre suas contas e investimentos ficam fora das análises de gastos e do plano.
        </Text>
      ) : null}
      <Select
        label="Categoria:"
        options={[
          { id: NO_CATEGORY, label: '(sem categoria)' },
          ...categories.map((c) => ({ id: c.id, label: `${c.name} (${c.type === 'EXPENSE' ? 'despesa' : 'receita'})` })),
        ]}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />
      {categoryId ? (
        <View style={styles.apply}>
          <Checkbox
            checked={apply}
            onChange={setApply}
            label="Mover também as transações já lançadas para esta categoria"
          />
        </View>
      ) : null}
      <Text style={styles.hint}>As próximas importações sugerem esta categoria automaticamente.</Text>
      <Select
        label="Classificação do gasto:"
        options={[
          { id: AUTOMATIC, label: 'Automática (pelas regras)' },
          ...SPENDING_CLASSES.map((c) => ({ id: c.class, label: c.label })),
        ]}
        selectedId={spendingClass}
        onSelect={setSpendingClass}
      />
      <DialogButtons confirmLabel="Salvar" onConfirm={handleSubmit} onCancel={onClose} loading={saving} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: fontSize.sm, color: colors.textPrimary, marginBottom: spacing.xs },
  hint: { fontSize: fontSize.xs, color: colors.textSecondary, marginBottom: spacing.md },
  apply: { marginBottom: spacing.sm },
});
