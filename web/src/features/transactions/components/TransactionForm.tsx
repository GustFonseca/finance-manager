import React, { useEffect, useState } from 'react';
import { DialogButtons, Input, Modal, RadioGroup, Select } from '@/components/ui';
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
    <Modal visible={visible} onClose={onClose} icon="exchange" title="Nova Transação">
      <RadioGroup
        value={type}
        onChange={setType}
        options={[
          { value: 'EXPENSE', label: 'Despesa' },
          { value: 'INCOME', label: 'Receita' },
        ]}
      />

      <Input
        label="Valor:"
        placeholder="ex: 150,00"
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />
      <Input label="Descrição:" value={description} onChangeText={setDescription} />

      <Select
        label="Conta:"
        options={accounts.map((a) => ({ id: a.id, label: a.name }))}
        selectedId={accountId}
        onSelect={setAccountId}
      />
      <Select
        label="Categoria:"
        options={categories.map((c) => ({ id: c.id, label: c.name }))}
        selectedId={categoryId}
        onSelect={setCategoryId}
      />

      <DialogButtons
        confirmLabel="Salvar"
        onConfirm={handleSubmit}
        onCancel={onClose}
        loading={submitting}
      />
    </Modal>
  );
}
