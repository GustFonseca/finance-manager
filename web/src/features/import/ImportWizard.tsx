import React, { useEffect, useState } from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { useQueryClient } from '@tanstack/react-query';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button, Checkbox, Modal, MoneyText, Select } from '@/components/ui';
import { useAccounts } from '@/features/accounts/queries';
import { useCategories } from '@/features/categories/queries';
import { transactionsApi } from '@/features/transactions/api';
import { foldersApi } from '@/features/files/api';
import { invalidateFiles } from '@/features/files/queries';
import { merchantsApi } from '@/features/merchants/api';
import { invalidateMoney } from '@/features/transactions/queries';
import { getErrorMessage } from '@/lib/http';
import { colors, fontSize, spacing } from '@/theme';
import { findDuplicates } from './duplicates';
import { decodeStatement, parseStatement, StatementError } from './parsers';
import { dayToIso } from './text';
import { ImportRow, ParsedStatement, SOURCE_LABELS } from './types';

type Step = 'file' | 'review' | 'importing' | 'done';

type RowChoice = {
  include: boolean;
  categoryId: string | null;
  note?: string;
};

type Result = {
  imported: number;
  error: string | null;
  savedTo: string | null;
};

const STEP_HEADERS: Record<Step, { title: string; subtitle: string }> = {
  file: {
    title: 'Selecione o arquivo',
    subtitle: 'Exporte a fatura ou o extrato no app do Nubank e escolha o arquivo CSV ou OFX.',
  },
  review: {
    title: 'Revise as transações',
    subtitle: 'Desmarque o que não quer importar e ajuste as categorias sugeridas.',
  },
  importing: { title: 'Importando', subtitle: 'Aguarde enquanto as transações são criadas.' },
  done: { title: 'Importação concluída', subtitle: 'As contas e o painel já foram atualizados.' },
};

const formatDay = (day: string) => day.split('-').reverse().join('/');

export function ImportWizard({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { data: accounts = [] } = useAccounts();
  const { data: categories = [] } = useCategories();

  const [step, setStep] = useState<Step>('file');
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [statement, setStatement] = useState<ParsedStatement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [choices, setChoices] = useState<Record<string, RowChoice>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result>({ imported: 0, error: null, savedTo: null });

  useEffect(() => {
    if (!visible) return;
    setStep('file');
    setSourceFile(null);
    setStatement(null);
    setError(null);
    setChoices({});
  }, [visible]);

  useEffect(() => {
    if (!accounts.some((account) => account.id === accountId)) setAccountId(accounts[0]?.id ?? null);
  }, [accounts, accountId]);

  const rows = statement?.rows ?? [];
  const selected = rows.filter((row) => choices[row.key]?.include);
  const totals = selected.reduce(
    (sum, row) => ({ ...sum, [row.type]: sum[row.type] + row.amountCents }),
    { INCOME: 0, EXPENSE: 0 }
  );

  async function chooseFile(file: File | undefined) {
    setStatement(null);
    setError(null);
    if (!file) return;
    setSourceFile(file);
    try {
      const parsed = parseStatement(decodeStatement(await file.arrayBuffer()));
      if (parsed.rows.length === 0) throw new StatementError('O arquivo não tem transações.');
      setStatement(parsed);
    } catch (e) {
      setError(e instanceof StatementError ? e.message : 'Não foi possível ler o arquivo.');
    }
  }

  async function goToReview() {
    if (!statement) return;
    setBusy(true);
    try {
      const days = statement.rows.map((row) => row.date).sort();
      const [first, last] = [days[0], days[days.length - 1]];
      const existing = await transactionsApi.getAll({
        start: new Date(`${first}T00:00:00`).toISOString(),
        end: new Date(`${last}T23:59:59`).toISOString(),
      });
      const duplicates = findDuplicates(statement.rows, existing);
      const matches = await merchantsApi.resolve(
        statement.rows.map((row) => ({ description: row.description, type: row.type }))
      );
      const next: Record<string, RowChoice> = {};
      statement.rows.forEach((row, index) => {
        const duplicate = duplicates.has(row.key);
        const match = matches[index];
        next[row.key] = {
          include: !duplicate && !match?.skipReason,
          categoryId: match?.categoryId ?? null,
          note: duplicate ? 'Já existe no app' : (match?.skipReason ?? undefined),
        };
      });
      setChoices(next);
      setStep('review');
    } catch (e) {
      setError(getErrorMessage(e, 'Não foi possível consultar as transações existentes.'));
    } finally {
      setBusy(false);
    }
  }

  async function runImport() {
    if (!accountId) return;
    setStep('importing');
    try {
      const imported = await transactionsApi.importMany({
        accountId,
        lines: selected.map((row) => ({
          date: dayToIso(row.date),
          description: row.description,
          amountCents: row.amountCents,
          type: row.type,
          categoryId: choices[row.key].categoryId!,
        })),
      });
      invalidateMoney(qc);
      setResult({ imported, error: null, savedTo: await saveStatementFile() });
    } catch (e) {
      setResult({ imported: 0, error: getErrorMessage(e, 'Não foi possível importar as transações'), savedTo: null });
    }
    setStep('done');
  }

  async function saveStatementFile(): Promise<string | null> {
    if (!sourceFile) return null;
    try {
      const folder = (await foldersApi.getAll()).find((f) => f.isSystem);
      if (!folder) return null;
      await foldersApi.upload(folder.id, [sourceFile]);
      invalidateFiles(qc);
      return folder.name;
    } catch {
      return null;
    }
  }

  function updateChoice(key: string, change: Partial<RowChoice>) {
    setChoices((prev) => ({ ...prev, [key]: { ...prev[key], ...change } }));
  }

  function toggleAll(include: boolean) {
    setChoices((prev) =>
      Object.fromEntries(Object.entries(prev).map(([key, choice]) => [key, { ...choice, include }]))
    );
  }

  const header =
    step === 'done' && result.error
      ? {
          title: 'A importação não foi feita',
          subtitle: 'Nenhuma transação foi criada. Corrija o problema abaixo e importe o arquivo de novo.',
        }
      : STEP_HEADERS[step];

  return (
    <Modal
      visible={visible}
      onClose={step === 'importing' ? () => {} : onClose}
      icon="upload"
      title="Assistente para importação de extrato"
      width={step === 'review' ? 820 : 520}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>{header.title}</Text>
          <Text style={styles.headerSubtitle}>{header.subtitle}</Text>
        </View>
        <FontAwesome name="upload" size={30} color={colors.primary} />
      </View>

      <View style={styles.body}>
        {step === 'file' && (
          <>
            <Text style={styles.label}>Arquivo:</Text>
            <input
              type="file"
              accept=".csv,.ofx,text/csv"
              onChange={(event) => chooseFile(event.target.files?.[0])}
              style={fileInputStyle}
            />
            {statement ? (
              <Text style={[styles.info, styles.fileInfo]}>
                {SOURCE_LABELS[statement.source]}: {statement.rows.length} lançamento(s) em "{sourceFile?.name}".
              </Text>
            ) : null}
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Select
              label="Importar para a conta:"
              options={accounts.map((account) => ({ id: account.id, label: account.name }))}
              selectedId={accountId}
              onSelect={setAccountId}
            />
          </>
        )}

        {step === 'review' && (
          <>
            <View style={[styles.row, styles.tableHeader]}>
              <Checkbox
                checked={selected.length === rows.length}
                onChange={toggleAll}
                accessibilityLabel="Marcar todas"
              />
              <Text style={[styles.colDate, styles.th]}>Data</Text>
              <Text style={[styles.colDescription, styles.th]}>Descrição</Text>
              <Text style={[styles.colCategory, styles.th]}>Categoria</Text>
              <Text style={[styles.colAmount, styles.th]}>Valor</Text>
            </View>
            <ScrollView style={styles.table}>
              {rows.map((row) => (
                <ReviewRow
                  key={row.key}
                  row={row}
                  choice={choices[row.key]}
                  categories={categories
                    .filter((category) => category.type === row.type)
                    .map((category) => ({ id: category.id, label: category.name }))}
                  onChange={(change) => updateChoice(row.key, change)}
                />
              ))}
            </ScrollView>
            <View style={styles.summary}>
              <Text style={styles.info}>
                {selected.length} de {rows.length} selecionada(s) · Entradas{' '}
              </Text>
              <MoneyText cents={totals.INCOME} tone="income" style={styles.summaryValue} />
              <Text style={styles.info}> · Saídas </Text>
              <MoneyText cents={totals.EXPENSE} tone="expense" style={styles.summaryValue} />
            </View>
          </>
        )}

        {step === 'importing' && (
          <View style={styles.progress}>
            <Text style={styles.info}>Importando {selected.length} transação(ões)...</Text>
          </View>
        )}

        {step === 'done' && (
          <>
            {result.error ? (
              <Text style={styles.error}>{result.error}</Text>
            ) : (
              <>
                <Text style={styles.info}>{result.imported} transação(ões) importada(s).</Text>
                <Text style={result.savedTo ? styles.info : styles.error}>
                  {result.savedTo
                    ? `O arquivo foi salvo na pasta "${result.savedTo}" da área de trabalho.`
                    : 'Não foi possível salvar uma cópia do arquivo na área de trabalho.'}
                </Text>
              </>
            )}
          </>
        )}
      </View>

      <View style={styles.buttons}>
        {step === 'done' ? (
          <Button label="Concluir" onPress={onClose} />
        ) : (
          <>
            <Button
              label="< Voltar"
              variant="secondary"
              disabled={step !== 'review'}
              onPress={() => setStep('file')}
            />
            <Button
              label={step === 'review' ? 'Importar' : 'Avançar >'}
              disabled={
                step === 'importing' ||
                !accountId ||
                (step === 'file'
                  ? !statement
                  : selected.length === 0 || selected.some((row) => !choices[row.key].categoryId))
              }
              loading={busy}
              onPress={step === 'review' ? runImport : goToReview}
            />
            <Button
              label="Cancelar"
              variant="secondary"
              disabled={step === 'importing'}
              onPress={onClose}
            />
          </>
        )}
      </View>
    </Modal>
  );
}

type ReviewRowProps = {
  row: ImportRow;
  choice: RowChoice | undefined;
  categories: { id: string; label: string }[];
  onChange: (change: Partial<RowChoice>) => void;
};

function ReviewRow({ row, choice, categories, onChange }: ReviewRowProps) {
  if (!choice) return null;
  return (
    <View style={[styles.row, !choice.include && styles.rowSkipped]}>
      <Checkbox
        checked={choice.include}
        onChange={(include) => onChange({ include })}
        accessibilityLabel={`Importar ${row.description}`}
      />
      <Text style={[styles.colDate, styles.td]}>{formatDay(row.date)}</Text>
      <View style={styles.colDescription}>
        <Text style={styles.td} numberOfLines={1}>
          {row.description}
        </Text>
        {choice.note ? <Text style={styles.note}>{choice.note}</Text> : null}
      </View>
      <View style={styles.colCategory}>
        <Select
          compact
          options={categories}
          selectedId={choice.categoryId}
          onSelect={(categoryId) => onChange({ categoryId })}
        />
      </View>
      <MoneyText
        cents={row.type === 'EXPENSE' ? -row.amountCents : row.amountCents}
        tone={row.type === 'EXPENSE' ? 'expense' : 'income'}
        style={[styles.colAmount, styles.td]}
      />
    </View>
  );
}

const fileInputStyle: React.CSSProperties = { fontSize: fontSize.sm, marginBottom: spacing.sm };

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
  label: { fontSize: fontSize.sm, color: colors.textPrimary, marginBottom: spacing.xs },
  info: { fontSize: fontSize.sm, color: colors.textPrimary },
  fileInfo: { marginBottom: spacing.md },
  error: { fontSize: fontSize.sm, color: colors.expense, marginVertical: spacing.xs },
  table: {
    maxHeight: 320,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.inputBorder,
  },
  tableHeader: {
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: colors.inputBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: 3,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  rowSkipped: { opacity: 0.55 },
  th: { fontSize: fontSize.xs, fontWeight: '700', color: colors.textPrimary },
  td: { fontSize: fontSize.sm, color: colors.textPrimary },
  note: { fontSize: fontSize.xs, color: colors.textMuted, fontStyle: 'italic' },
  colDate: { width: 72 },
  colDescription: { flex: 1, minWidth: 0 },
  colCategory: { width: 150 },
  colAmount: { width: 100, textAlign: 'right' },
  summary: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'baseline', marginTop: spacing.sm },
  summaryValue: { fontSize: fontSize.sm, fontWeight: '700' },
  progress: { gap: spacing.sm, paddingTop: spacing.lg },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
