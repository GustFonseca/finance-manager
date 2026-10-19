import React, { useEffect, useRef, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { Button, DateInput, FormError, Input, Modal, ProgressBar, Select, useDialog } from '@/components/ui';
import { PixelIcon } from '@/components/ui/PixelIcon';
import { useAccounts } from '@/features/accounts/queries';
import { useCategories } from '@/features/categories/queries';
import { MISSING_ACCOUNT, MISSING_CATEGORY, MISSING_DATE } from '@/features/transactions/components/TransactionForm';
import { useCreateTransaction, useSetReceipt } from '@/features/transactions/queries';
import { RECEIPTS_FOLDER } from '@/features/transactions/receipts';
import { getErrorMessage } from '@/lib/http';
import { formatCentsForInput, INVALID_AMOUNT_MESSAGE, parseToCents } from '@/lib/money';
import { dayToIso, todayKey } from '@/lib/periods';
import { colors, fontSize, palette, spacing } from '@/theme';
import { PreparedImage, prepareImage, releaseImage } from './image';
import { formatCnpj, mergeReceipt, PAYMENT_LABELS } from './parse';
import { ScanProblem, scanReceipt, ScanResult, ScanStage } from './scan';

type Step = 'photo' | 'reading' | 'review';

type Draft = {
  amount: string;
  description: string;
  day: string;
  accountId: string | null;
  categoryId: string | null;
};

const STEP_HEADERS: Record<Step, { title: string; subtitle: string }> = {
  photo: {
    title: 'Tirar foto',
    subtitle: 'Fotografe a nota fiscal ou o cupom inteiro, bem esticado e com boa luz, incluindo o QR Code.',
  },
  reading: {
    title: 'Lendo a nota…',
    subtitle: 'A leitura é feita no próprio aparelho e pode levar alguns segundos.',
  },
  review: {
    title: 'Confira e lance',
    subtitle: 'Confira os dados lidos antes de lançar. A foto fica anexada como comprovante.',
  },
};

export const STAGES: { stage: ScanStage; label: string }[] = [
  { stage: 'qr', label: 'Procurando o QR Code' },
  { stage: 'text', label: 'Lendo o texto' },
  { stage: 'company', label: 'Consultando a empresa' },
];

const STAGE_START: Record<ScanStage, number> = { qr: 0, text: 10, company: 90 };
const TEXT_SHARE = 80;

export const PROBLEM_MESSAGES: Record<ScanProblem, string> = {
  offline:
    'Sem conexão com a internet: o leitor de texto precisa ser baixado. Preencha os dados à mão; a foto continua anexada.',
  ocr: 'Não consegui ler o texto da nota. Preencha os dados à mão; a foto continua anexada.',
  unreadable:
    'Não consegui ler nada nesta foto. Tire outra com mais luz e a nota bem esticada, ou preencha os dados à mão.',
};

export const IMAGE_ERROR = 'Não consegui abrir esta imagem. Tire outra foto ou preencha os dados à mão.';

export const HINTS = {
  total: 'Não consegui ler o valor, preencha.',
  name: 'Não consegui ler o nome da loja, preencha a descrição.',
  date: 'Não consegui ler a data; usei a de hoje, confira.',
};

export const SUCCESS_MESSAGE = 'Transação lançada com a nota anexada.';
export const RECEIPT_LATER_MESSAGE =
  `A transação foi lançada, mas não foi possível anexar a foto da nota. ` +
  `Você pode anexá-la depois pelo menu da transação, em "Anexar comprovante".`;

const UNKNOWN_DESCRIPTION = 'Compra';

export function ReceiptScanner({ onClose }: { onClose: () => void }) {
  const { alert } = useDialog();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories('EXPENSE');
  const createTransaction = useCreateTransaction();
  const setReceipt = useSetReceipt();
  const fileInput = useRef<HTMLInputElement>(null);
  const scan = useRef<AbortController | null>(null);

  const [step, setStep] = useState<Step>('photo');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [image, setImage] = useState<PreparedImage | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [stage, setStage] = useState<ScanStage>('qr');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => () => scan.current?.abort(), []);
  useEffect(() => () => releaseImage(image), [image]);

  const selectedAccountId = accounts.some((a) => a.id === draft?.accountId) ? draft!.accountId : (accounts[0]?.id ?? null);
  const selectedCategoryId = categories.some((c) => c.id === draft?.categoryId)
    ? draft!.categoryId
    : (categories[0]?.id ?? null);

  function resetPhoto() {
    setAttachment(null);
    setImage(null);
    setPhotoError(null);
    setResult(null);
    setDraft(null);
  }

  async function choosePhoto(file: File | undefined) {
    if (!file) return;
    resetPhoto();
    setAttachment(file);
    setPreparing(true);
    try {
      const prepared = await prepareImage(file);
      setImage(prepared);
      setAttachment(prepared.photo);
    } catch {
      setPhotoError(IMAGE_ERROR);
    } finally {
      setPreparing(false);
    }
  }

  function showReview(scanned: ScanResult) {
    const { receipt } = scanned;
    setResult(scanned);
    setDraft({
      amount: receipt.totalCents ? formatCentsForInput(receipt.totalCents) : '',
      description: receipt.merchantName ?? UNKNOWN_DESCRIPTION,
      day: receipt.day ?? todayKey(),
      accountId: null,
      categoryId: scanned.categoryId,
    });
    setError(null);
    setStep('review');
  }

  function startReading() {
    const controller = new AbortController();
    scan.current = controller;
    setStage('qr');
    setProgress(0);
    setStep('reading');
    scanReceipt(image!, {
      signal: controller.signal,
      onStage: (next) => {
        setStage(next);
        setProgress((current) => Math.max(current, STAGE_START[next]));
      },
      onProgress: (fraction) =>
        setProgress((current) => Math.max(current, STAGE_START.text + fraction * TEXT_SHARE)),
    }).then(showReview, () => undefined);
  }

  function cancelReading() {
    scan.current?.abort();
    scan.current = null;
    setStep('photo');
  }

  function fillManually() {
    showReview({ receipt: mergeReceipt(null, null, null), categoryId: null, problem: null });
  }

  function retake() {
    resetPhoto();
    setStep('photo');
    fileInput.current?.click();
  }

  function close() {
    scan.current?.abort();
    onClose();
  }

  function update(change: Partial<Draft>) {
    setDraft((current) => ({ ...current!, ...change }));
  }

  async function submit() {
    const current = draft!;
    const amountCents = parseToCents(current.amount);
    const problem =
      amountCents === null ? INVALID_AMOUNT_MESSAGE
      : !current.day ? MISSING_DATE
      : !selectedAccountId ? MISSING_ACCOUNT
      : !selectedCategoryId ? MISSING_CATEGORY
      : null;
    setError(problem);
    if (problem) return;
    setSubmitting(true);
    let transactionId: string;
    try {
      const created = await createTransaction.mutateAsync({
        accountId: selectedAccountId!,
        categoryId: selectedCategoryId!,
        type: 'EXPENSE',
        amountCents: amountCents!,
        description: current.description.trim() || UNKNOWN_DESCRIPTION,
        date: dayToIso(current.day),
      });
      transactionId = created.id;
    } catch (e) {
      setError(getErrorMessage(e, 'Não foi possível lançar a transação'));
      setSubmitting(false);
      return;
    }
    try {
      await setReceipt.mutateAsync({ id: transactionId, file: attachment! });
      alert({ title: 'Transação lançada', message: SUCCESS_MESSAGE });
    } catch {
      alert({ title: 'Transação lançada', message: RECEIPT_LATER_MESSAGE });
    }
    onClose();
  }

  const header = STEP_HEADERS[step];
  const receipt = result?.receipt;
  const stageIndex = STAGES.findIndex((item) => item.stage === stage);

  return (
    <Modal visible onClose={submitting ? () => {} : close} icon="camera" title="Ler nota fiscal" width={520}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{header.title}</Text>
          <Text style={styles.headerSubtitle}>{header.subtitle}</Text>
        </View>
        <PixelIcon name="camera" size={30} color={colors.primary} />
      </View>

      <View style={styles.body}>
        {step === 'photo' && (
          <>
            <Text style={styles.info}>
              No celular, o botão abre a câmera traseira; no computador, escolha a foto da nota. O app procura o QR Code da
              NFC-e, lê o texto da nota no próprio aparelho e já preenche a despesa para você conferir.
            </Text>
            <View style={styles.photoActions}>
              <Button label="Tirar foto" onPress={() => fileInput.current?.click()} loading={preparing} />
            </View>
            {image ? (
              <Image
                source={{ uri: image.previewUrl }}
                style={styles.preview}
                resizeMode="contain"
                accessibilityLabel="Foto da nota"
              />
            ) : null}
            <FormError message={photoError} />
          </>
        )}

        {step === 'reading' && (
          <View style={styles.reading}>
            <ProgressBar percent={progress} />
            <Text style={styles.percent}>{Math.round(progress)}%</Text>
            {STAGES.map((item, index) => (
              <View key={item.stage} style={styles.stageRow}>
                <PixelIcon
                  name={index < stageIndex ? 'check' : index === stageIndex ? 'arrow-right' : 'circle-o'}
                  size={12}
                  color={index <= stageIndex ? colors.primary : colors.textMuted}
                />
                <Text style={[styles.info, index === stageIndex && styles.current, index > stageIndex && styles.pending]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        )}

        {step === 'review' && result && receipt && draft && (
          <>
            {result.problem ? <FormError message={PROBLEM_MESSAGES[result.problem]} /> : null}
            <View style={styles.detected}>
              {image ? (
                <Image
                  source={{ uri: image.previewUrl }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                  accessibilityLabel="Miniatura da nota"
                />
              ) : null}
              <View style={styles.detectedText}>
                <Text style={styles.info}>CNPJ: {receipt.cnpj ? formatCnpj(receipt.cnpj) : 'não encontrado'}</Text>
                <Text style={styles.info}>Empresa: {receipt.merchantName ?? 'não identificada'}</Text>
                {receipt.activity ? <Text style={styles.note}>{receipt.activity}</Text> : null}
                <Text style={styles.info}>
                  Forma de pagamento: {receipt.payment ? PAYMENT_LABELS[receipt.payment] : 'não identificada'}
                </Text>
                <Text style={styles.note}>
                  {receipt.accessKey ? 'QR Code da NFC-e lido.' : 'QR Code da NFC-e não encontrado.'} A foto vai para a
                  pasta "{RECEIPTS_FOLDER}".
                </Text>
              </View>
            </View>

            <Field hint={receipt.found.total ? null : HINTS.total}>
              <Input
                label="Valor:"
                placeholder="ex: 150,00"
                keyboardType="decimal-pad"
                value={draft.amount}
                onChangeText={(amount) => update({ amount })}
              />
            </Field>
            <Field hint={receipt.found.name ? null : HINTS.name}>
              <Input
                label="Descrição:"
                value={draft.description}
                onChangeText={(description) => update({ description })}
              />
            </Field>
            <Field hint={receipt.found.date ? null : HINTS.date}>
              <DateInput label="Data:" value={draft.day} onChange={(day) => update({ day })} />
            </Field>
            <Select
              label="Conta:"
              options={accounts.map((a) => ({ id: a.id, label: a.name }))}
              selectedId={selectedAccountId}
              onSelect={(accountId) => update({ accountId })}
            />
            <Select
              label="Categoria:"
              options={categories.map((c) => ({ id: c.id, label: c.name }))}
              selectedId={selectedCategoryId}
              onSelect={(categoryId) => update({ categoryId })}
            />
            <FormError message={error} />
          </>
        )}
      </View>

      <View style={styles.buttons}>
        {step === 'photo' && (
          <>
            <Button
              label="Preencher à mão"
              variant="secondary"
              disabled={!attachment || preparing}
              onPress={fillManually}
            />
            <Button label="Ler nota >" disabled={!image} onPress={startReading} />
            <Button label="Cancelar" variant="secondary" onPress={close} />
          </>
        )}
        {step === 'reading' && <Button label="Cancelar" variant="secondary" onPress={cancelReading} />}
        {step === 'review' && (
          <>
            <Button label="< Tirar outra" variant="secondary" disabled={submitting} onPress={retake} />
            <Button label="Lançar" loading={submitting} onPress={submit} />
            <Button label="Cancelar" variant="secondary" disabled={submitting} onPress={close} />
          </>
        )}
      </View>

      <input
        ref={fileInput}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Arquivo da foto da nota"
        style={hiddenInput}
        onChange={(event) => {
          choosePhoto(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
    </Modal>
  );
}

function Field({ hint, children }: { hint: string | null; children: React.ReactNode }) {
  return (
    <View style={hint ? styles.missing : undefined}>
      {children}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const hiddenInput: React.CSSProperties = { display: 'none' };

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: -spacing.md,
    marginTop: -spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerText: { flex: 1 },
  headerTitle: { fontSize: fontSize.md, fontWeight: '700', color: colors.textPrimary },
  headerSubtitle: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2, marginLeft: spacing.md },
  body: { paddingVertical: spacing.md, minHeight: 120 },
  info: { fontSize: fontSize.sm, color: colors.textPrimary },
  note: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic' },
  photoActions: { flexDirection: 'row', marginVertical: spacing.md },
  preview: {
    width: '100%',
    height: 240,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  reading: { gap: spacing.sm, paddingTop: spacing.sm },
  percent: { fontSize: fontSize.xs, color: colors.textSecondary, textAlign: 'right' },
  stageRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  current: { fontWeight: '700' },
  pending: { color: colors.textMuted },
  detected: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  thumbnail: { width: 72, height: 96, borderWidth: 1, borderColor: colors.border },
  detectedText: { flex: 1, gap: 2 },
  missing: {
    borderLeftWidth: 3,
    borderLeftColor: palette.amber,
    paddingLeft: spacing.sm,
    marginBottom: spacing.sm,
  },
  hint: { fontSize: fontSize.xs, color: colors.expense, marginTop: -spacing.sm, marginBottom: spacing.sm },
  buttons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
