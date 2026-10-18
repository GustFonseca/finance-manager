import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Modal, Select, useDialog } from '@/components/ui';
import { useCategories } from '@/features/categories/queries';
import { getErrorMessage } from '@/lib/http';
import { formatCents } from '@/lib/money';
import { monthKeyOf, twelveMonthsUntil } from '@/lib/periods';
import { colors, fontSize, spacing } from '@/theme';
import { useUnsortedMerchants, useUpdateMerchant } from '../queries';
import { kindLabel, MerchantSpendingDto } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function OrganizeMerchants({ visible, onClose }: Props) {
  const { alert } = useDialog();
  const range = useMemo(() => twelveMonthsUntil(monthKeyOf(new Date())), []);
  const { data: merchants = [], isLoading } = useUnsortedMerchants(range, visible);
  const { data: categories = [] } = useCategories('EXPENSE');
  const updateMerchant = useUpdateMerchant();
  const [saving, setSaving] = useState<string | null>(null);
  const [organized, setOrganized] = useState(0);

  async function assign(merchant: MerchantSpendingDto, categoryId: string) {
    setSaving(merchant.merchantId);
    try {
      await updateMerchant.mutateAsync({
        id: merchant.merchantId!,
        data: { name: merchant.name, kind: merchant.kind, categoryId, applyToTransactions: true },
      });
      setOrganized((count) => count + 1);
    } catch (error) {
      alert({ title: 'Erro', message: getErrorMessage(error, 'Não foi possível salvar a categoria') });
    } finally {
      setSaving(null);
    }
  }

  return (
    <Modal visible={visible} onClose={onClose} icon="tags" title="Organizar gastos" width={680}>
      <Text style={styles.intro}>
        Estabelecimentos sem categoria (ou em "Outros") nos últimos 12 meses, do maior gasto para o menor. A categoria
        escolhida vale para todas as transações do estabelecimento e para as próximas importações.
      </Text>
      {organized > 0 ? <Text style={styles.done}>{organized} estabelecimento(s) organizado(s) agora.</Text> : null}

      {isLoading ? (
        <Text style={styles.muted}>Carregando...</Text>
      ) : merchants.length === 0 ? (
        <Text style={styles.muted}>Tudo organizado! Nenhum estabelecimento sem categoria.</Text>
      ) : (
        merchants.map((merchant) => (
          <View key={merchant.merchantId} style={styles.row}>
            <View style={styles.info}>
              <Text style={styles.name} numberOfLines={1}>
                {merchant.name}
              </Text>
              <Text style={styles.muted}>
                {kindLabel(merchant.kind)} · {merchant.count} transação(ões) · {formatCents(merchant.cents)}
              </Text>
            </View>
            {saving === merchant.merchantId ? (
              <Text style={styles.muted}>Salvando...</Text>
            ) : (
              <Select
                compact
                placeholder="(escolha a categoria)"
                options={categories
                  .filter((c) => c.name !== merchant.categoryName)
                  .map((c) => ({ id: c.id, label: c.name }))}
                selectedId={null}
                onSelect={(categoryId) => assign(merchant, categoryId)}
              />
            )}
          </View>
        ))
      )}

      <View style={styles.buttons}>
        <Button label="Fechar" variant="primary" onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  intro: { fontSize: fontSize.sm, color: colors.textSecondary, marginBottom: spacing.sm },
  done: { fontSize: fontSize.sm, color: colors.income, fontWeight: '700', marginBottom: spacing.sm },
  muted: { fontSize: fontSize.xs, color: colors.textSecondary },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  info: { flex: 1, minWidth: 0 },
  name: { fontSize: fontSize.sm, color: colors.textPrimary, fontWeight: '700' },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md },
});
