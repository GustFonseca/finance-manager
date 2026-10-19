import React from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Button, ErrorState, Modal, MoneyText, useDialog } from '@/components/ui';
import { filesApi } from '@/features/files/api';
import { formatBytes } from '@/features/files/format';
import { getErrorMessage } from '@/lib/http';
import { queryKeys } from '@/lib/queryKeys';
import { bevels, colors, fontSize, palette, spacing, webStyle } from '@/theme';
import { TransactionDto } from '../types';

export const RECEIPT_VIEW_STALE_MS = 60_000;

const RECURRENCE_LABELS: Record<string, string> = {
  DAILY: 'Diária',
  WEEKLY: 'Semanal',
  MONTHLY: 'Mensal',
  YEARLY: 'Anual',
};

type Props = {
  transaction: TransactionDto | null;
  onClose: () => void;
};

export function ReceiptViewer({ transaction, onClose }: Props) {
  const { alert } = useDialog();
  const fileId = transaction?.receiptFileId ?? null;
  const view = useQuery({
    queryKey: [...queryKeys.files, 'view', fileId],
    queryFn: () => filesApi.view(fileId!),
    enabled: !!fileId,
    staleTime: RECEIPT_VIEW_STALE_MS,
  });

  async function download() {
    try {
      window.location.href = await filesApi.downloadUrl(fileId!);
    } catch (e) {
      alert({ title: 'Erro', message: getErrorMessage(e, 'Não foi possível baixar o comprovante') });
    }
  }

  if (!transaction) return null;

  const expense = transaction.type === 'EXPENSE';
  const rows: [string, string][] = [
    ['Data', new Date(transaction.date).toLocaleDateString('pt-BR')],
    ['Estabelecimento', transaction.merchantName],
    ['Categoria', transaction.categoryName],
    ['Conta', transaction.accountName],
    ['Recorrência', RECURRENCE_LABELS[transaction.recurrence] ?? ''],
  ];

  return (
    <Modal visible onClose={onClose} icon="paperclip" title="Comprovante" width={760}>
      <View style={styles.layout}>
        <View style={styles.details}>
          <Text style={styles.description}>{transaction.description || transaction.merchantName || 'Transação'}</Text>
          <MoneyText
            cents={expense ? -transaction.amountCents : transaction.amountCents}
            signed
            tone={expense ? 'expense' : 'income'}
            style={styles.amount}
          />
          {rows
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <View key={label} style={styles.row}>
                <Text style={styles.label}>{label}</Text>
                <Text style={styles.value}>{value}</Text>
              </View>
            ))}
          {view.data ? (
            <Text style={styles.file}>
              {view.data.name} · {formatBytes(view.data.sizeBytes)}
            </Text>
          ) : null}
        </View>

        <View style={styles.preview}>
          {view.error ? (
            <ErrorState error={view.error} fallback="Não foi possível abrir o comprovante" onRetry={() => view.refetch()} />
          ) : !view.data ? (
            <Text style={styles.hint}>Carregando comprovante...</Text>
          ) : view.data.contentType.startsWith('image/') ? (
            <Image
              source={{ uri: view.data.url }}
              resizeMode="contain"
              accessibilityLabel={`Foto do comprovante ${view.data.name}`}
              style={styles.image}
            />
          ) : view.data.contentType === 'application/pdf' ? (
            <iframe title={`Comprovante ${view.data.name}`} src={view.data.url} style={pdfStyle} />
          ) : (
            <Text style={styles.hint}>Não dá para mostrar este tipo de arquivo aqui. Use "Baixar".</Text>
          )}
        </View>
      </View>

      <View style={styles.buttons}>
        <Button variant="secondary" label="Baixar" onPress={download} disabled={!fileId} />
        <Button label="Fechar" onPress={onClose} />
      </View>
    </Modal>
  );
}

const PREVIEW_HEIGHT = 420;

const pdfStyle = { width: '100%', height: PREVIEW_HEIGHT, border: 'none', background: '#FFFFFF' };

const styles = StyleSheet.create({
  layout: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  details: { flexGrow: 1, flexBasis: 220, gap: spacing.xs },
  description: { fontSize: fontSize.lg, fontWeight: '700', color: colors.textPrimary },
  amount: { fontSize: fontSize.xxl, fontWeight: '700', marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  label: { fontSize: fontSize.sm, color: colors.textSecondary },
  value: { fontSize: fontSize.sm, color: colors.textPrimary, textAlign: 'right', flexShrink: 1 },
  file: { fontSize: fontSize.xs, color: colors.textMuted, marginTop: spacing.sm },
  preview: {
    flexGrow: 2,
    flexBasis: 320,
    minHeight: PREVIEW_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: palette.stone,
    padding: spacing.xs,
    ...webStyle({ boxShadow: bevels.sunken }),
  },
  image: { width: '100%', height: PREVIEW_HEIGHT },
  hint: { fontSize: fontSize.sm, color: colors.textSecondary, textAlign: 'center', padding: spacing.md },
  buttons: { flexDirection: 'row', justifyContent: 'flex-end', gap: spacing.sm, marginTop: spacing.md },
});
