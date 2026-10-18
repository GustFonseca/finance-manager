import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, DialogButtons, Input, Modal } from '@/components/ui';
import { formatCents, formatCentsForInput, parseToCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { CategoryBudgetDto } from '../types';

type Props = {
  budget: CategoryBudgetDto | null;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (limitCents: number | null) => void;
};

export function BudgetForm({ budget, saving, onClose, onSubmit }: Props) {
  const [amount, setAmount] = useState('');

  useEffect(() => {
    if (budget) setAmount(budget.limitCents ? formatCentsForInput(budget.limitCents) : '');
  }, [budget]);

  function handleSubmit() {
    const cents = parseToCents(amount);
    if (cents === null) return;
    onSubmit(cents);
  }

  return (
    <Modal
      visible={!!budget}
      onClose={onClose}
      icon="money"
      title={budget ? `Orçamento — ${budget.categoryName}` : ''}>
      {budget ? (
        <>
          <Text style={styles.info}>
            Gasto neste mês: {formatCents(budget.spentCents)} · Média: {formatCents(budget.averageCents)}
          </Text>
          <Input
            label="Limite por mês:"
            placeholder="ex: 800,00"
            keyboardType="decimal-pad"
            value={amount}
            onChangeText={setAmount}
            autoFocus
          />
          <View style={styles.shortcuts}>
            {budget.suggestedLimitCents > 0 ? (
              <Button
                size="sm"
                variant="secondary"
                label={`Usar sugerido (${formatCents(budget.suggestedLimitCents)})`}
                onPress={() => setAmount(formatCentsForInput(budget.suggestedLimitCents))}
              />
            ) : null}
            {budget.limitCents ? (
              <Button size="sm" variant="danger" label="Remover limite" onPress={() => onSubmit(null)} />
            ) : null}
          </View>
          <DialogButtons confirmLabel="Salvar" onConfirm={handleSubmit} onCancel={onClose} loading={saving} />
        </>
      ) : null}
    </Modal>
  );
}

const styles = StyleSheet.create({
  info: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  shortcuts: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.xs },
});
