import React, { useEffect, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { DialogButtons, FormError, Input, Modal } from '@/components/ui';
import { INVALID_AMOUNT_MESSAGE, parseToCents } from '@/lib/money';
import { colors, fontSize, spacing } from '@/theme';
import { CreateWishInput } from '../types';

type Props = {
  visible: boolean;
  waitHours: number;
  saving?: boolean;
  onClose: () => void;
  onSubmit: (data: CreateWishInput) => void;
};

export const WISH_NAME_REQUIRED = 'Diga o que você quer comprar.';

export function WishForm({ visible, waitHours, saving, onClose, onSubmit }: Props) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [link, setLink] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName('');
    setPrice('');
    setLink('');
    setError(null);
  }, [visible]);

  function handleSubmit() {
    const priceCents = parseToCents(price);
    const problem = !name.trim() ? WISH_NAME_REQUIRED : priceCents === null ? INVALID_AMOUNT_MESSAGE : null;
    setError(problem);
    if (problem) return;
    onSubmit({ name: name.trim(), priceCents: priceCents!, link: link.trim() || null });
  }

  return (
    <Modal visible={visible} onClose={onClose} icon="hourglass-half" title="Novo desejo">
      <Input label="O que você quer comprar:" placeholder="ex: Fone de ouvido" value={name} onChangeText={setName} />
      <Input label="Preço:" placeholder="ex: 350,00" keyboardType="decimal-pad" value={price} onChangeText={setPrice} />
      <Input label="Link (opcional):" placeholder="https://..." value={link} onChangeText={setLink} autoCapitalize="none" />
      <Text style={styles.hint}>
        O desejo fica {waitHours} h em espera. Se ainda quiser depois disso, compre sem culpa.
      </Text>
      <FormError message={error} />
      <DialogButtons confirmLabel="Adicionar" onConfirm={handleSubmit} onCancel={onClose} loading={saving} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  hint: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
});
