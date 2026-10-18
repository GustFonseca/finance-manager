import React, { useEffect, useState } from 'react';
import { DateInput, DialogButtons, FormError, Input, Modal, RadioGroup, Select } from '@/components/ui';
import { formatCentsForInput, INVALID_AMOUNT_MESSAGE, parseToCents } from '@/lib/money';
import { dayToIso, isoToDay, todayKey } from '@/lib/periods';
import { useAccounts } from '@/features/accounts/queries';
import { useCategories } from '@/features/categories/queries';
import { CreateTransactionRequest, TransactionDto, TransactionType } from '../types';

type Props = {
  visible: boolean;
  transaction?: TransactionDto | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTransactionRequest) => void;
};

export const MISSING_DATE = 'Informe a data da transação.';
export const MISSING_ACCOUNT = 'Crie uma conta antes de lançar transações.';
export const MISSING_CATEGORY = 'Crie uma categoria deste tipo antes de lançar a transação.';

export function TransactionForm({ visible, transaction, submitting, onClose, onSubmit }: Props) {
  const [type, setType] = useState<TransactionType>('EXPENSE');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [day, setDay] = useState(todayKey());
  const [accountId, setAccountId] = useState<string | null>(null);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories(type);

  useEffect(() => {
    if (!visible) return;
    setError(null);
    setType(transaction?.type ?? 'EXPENSE');
    setAmount(transaction ? formatCentsForInput(transaction.amountCents) : '');
    setDescription(transaction?.description ?? '');
    setDay(transaction ? isoToDay(transaction.date) : todayKey());
    setAccountId(transaction?.accountId ?? null);
    setCategoryId(transaction?.categoryId ?? null);
  }, [visible, transaction]);

  const selectedAccountId = accounts.some((a) => a.id === accountId) ? accountId : (accounts[0]?.id ?? null);
  const selectedCategoryId = categories.some((c) => c.id === categoryId) ? categoryId : (categories[0]?.id ?? null);

  function handleSubmit() {
    const amountCents = parseToCents(amount);
    const problem =
      amountCents === null || amountCents <= 0 ? INVALID_AMOUNT_MESSAGE
      : !day ? MISSING_DATE
      : !selectedAccountId ? MISSING_ACCOUNT
      : !selectedCategoryId ? MISSING_CATEGORY
      : null;
    setError(problem);
    if (problem) return;
    onSubmit({
      accountId: selectedAccountId!,
      categoryId: selectedCategoryId!,
      type,
      amountCents: amountCents!,
      description,
      date: dayToIso(day),
      recurrence: transaction?.recurrence,
    });
  }

  return (
    <Modal visible={visible} onClose={onClose} icon="exchange" title={transaction ? 'Editar Transação' : 'Nova Transação'}>
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
      <DateInput label="Data:" value={day} onChange={setDay} />

      <Select
        label="Conta:"
        options={accounts.map((a) => ({ id: a.id, label: a.name }))}
        selectedId={selectedAccountId}
        onSelect={setAccountId}
      />
      <Select
        label="Categoria:"
        options={categories.map((c) => ({ id: c.id, label: c.name }))}
        selectedId={selectedCategoryId}
        onSelect={setCategoryId}
      />

      <FormError message={error} />
      <DialogButtons
        confirmLabel="Salvar"
        onConfirm={handleSubmit}
        onCancel={onClose}
        loading={submitting}
      />
    </Modal>
  );
}
