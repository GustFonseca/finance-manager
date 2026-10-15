import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import {
  Button,
  ChipSelect,
  Input,
  Modal,
  SegmentedControl,
} from '@/components/ui';
import { colors, spacing, fontSize } from '@/theme';
import { parseToCents } from '@/lib/money';
import { useAccounts } from '@/features/accounts/queries';
import { useCategories } from '@/features/categories/queries';
import { CreateTransactionRequest, TransactionType } from '../types';

type Props = {
  visible: boolean;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransactionRequest) => void;
};

export function TransactionForm({ visible, submitting, onClose, onSubmit }: Props) {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories(type);

  useEffect(() => {
    if (!visible) return;
    setAmount('');
    setDescription('');
    setType('EXPENSE');
  }, [visible]);

  // Keep a valid account/category selected as the lists load or `type` changes.
  useEffect(() => {
    if (accounts.length && !accounts.some((a) => a.id === accountId)) {
      setAccountId(accounts[0].id);
    }
  }, [accounts, accountId]);

  useEffect(() => {
    if (!categories.some((c) => c.id === categoryId)) {
      setCategoryId(categories[0]?.id ?? null);
    }
  }, [categories, categoryId]);

  function handleSubmit() {
    const amountCents = parseToCents(amount);
    if (amountCents === null || !accountId || !categoryId) return;
    onSubmit({
      accountId,
      categoryId,
      type,
      amountCents,
      description,
      date: new Date().toISOString(),
    });
  }

  return (
    <Modal visible={visible} onClose={onClose} title="Nova Transação" position="bottom">
      <SegmentedControl
        value={type}
        onChange={setType}
        segments={[
          { value: 'EXPENSE', label: 'Despesa', activeColor: colors.expense },
          { value: 'INCOME', label: 'Receita', activeColor: colors.income },
        ]}
      />

      <Input
        placeholder="Valor (ex: 150,00)"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <Input placeholder="Descrição" value={description} onChangeText={setDescription} />

      <Text style={styles.label}>Conta</Text>
      <ChipSelect
        items={accounts.map((a) => ({ id: a.id, label: a.name }))}
        selectedId={accountId}
        onSelect={setAccountId}
      />

      <Text style={styles.label}>Categoria</Text>
      <ChipSelect
        items={categories.map((c) => ({ id: c.id, label: c.name, color: c.color }))}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />

      <View style={styles.actions}>
        <Button label="Cancelar" variant="secondary" onPress={onClose} style={styles.grow} />
        <Button label="Salvar" onPress={handleSubmit} loading={submitting} style={styles.grow} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: fontSize.sm,
    fontWeight: '600',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.sm },
  grow: { flex: 1 },
});
