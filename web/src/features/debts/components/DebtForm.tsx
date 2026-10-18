import React, { useEffect, useState } from 'react';
import { DialogButtons, FormError, Input, Modal } from '@/components/ui';
import { formatCentsForInput, INVALID_AMOUNT_MESSAGE, parseToCents } from '@/lib/money';
import { DebtDto, DebtInput } from '../types';

type Props = {
  visible: boolean;
  debt: DebtDto | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (data: DebtInput) => void;
};

export const DEBT_NAME_REQUIRED = 'Dê um nome para a dívida.';
export const DEBT_RATE_INVALID = 'Informe os juros ao mês, por exemplo 2,5.';
export const DEBT_MINIMUM_INVALID = 'Informe a parcela mínima, por exemplo 200,00.';

export function parseRate(text: string): number | null {
  const trimmed = text.trim().replace('%', '').trim();
  if (!/^\d+([.,]\d+)?$/.test(trimmed)) return null;
  return Number(trimmed.replace(',', '.'));
}

export function formatRate(percent: number): string {
  return percent.toLocaleString('pt-BR', { maximumFractionDigits: 4 });
}

export function DebtForm({ visible, debt, saving, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [rate, setRate] = useState('');
  const [minimum, setMinimum] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(debt?.name ?? '');
    setBalance(debt ? formatCentsForInput(debt.balanceCents) : '');
    setRate(debt ? formatRate(debt.monthlyRatePercent) : '');
    setMinimum(debt ? formatCentsForInput(debt.minimumPaymentCents) : '');
    setError(null);
  }, [visible, debt]);

  function handleSubmit() {
    const balanceCents = parseToCents(balance);
    const monthlyRatePercent = parseRate(rate);
    const minimumPaymentCents = parseToCents(minimum);
    const problem =
      !name.trim() ? DEBT_NAME_REQUIRED
      : balanceCents === null ? INVALID_AMOUNT_MESSAGE
      : monthlyRatePercent === null ? DEBT_RATE_INVALID
      : minimumPaymentCents === null ? DEBT_MINIMUM_INVALID
      : null;
    setError(problem);
    if (problem) return;
    onSubmit({
      name: name.trim(),
      balanceCents: balanceCents!,
      monthlyRatePercent: monthlyRatePercent!,
      minimumPaymentCents: minimumPaymentCents!,
    });
  }

  return (
    <Modal visible={visible} onClose={onClose} icon="credit-card" title={debt ? 'Editar dívida' : 'Nova dívida'}>
      <Input label="Nome:" placeholder="ex: Cartão de crédito" value={name} onChangeText={setName} />
      <Input label="Saldo devedor:" placeholder="ex: 3500,00" keyboardType="decimal-pad" value={balance} onChangeText={setBalance} />
      <Input label="Juros (% ao mês):" placeholder="ex: 2,5" keyboardType="decimal-pad" value={rate} onChangeText={setRate} />
      <Input label="Parcela mínima:" placeholder="ex: 200,00" keyboardType="decimal-pad" value={minimum} onChangeText={setMinimum} />
      <FormError message={error} />
      <DialogButtons confirmLabel="Salvar" onConfirm={handleSubmit} onCancel={onClose} loading={saving} />
    </Modal>
  );
}
