import { merchantsApi } from '@/features/merchants/api';
import { PreparedImage, readQrCode } from './image';
import { isOffline, recognizeText, ScanAborted } from './ocr';
import { mergeReceipt, parseNfceQr, parseReceiptText, ReceiptData, ReceiptText } from './parse';

export type ScanStage = 'qr' | 'text' | 'company';

export type ScanProblem = 'offline' | 'ocr' | 'unreadable';

export type ScanResult = {
  receipt: ReceiptData;
  categoryId: string | null;
  problem: ScanProblem | null;
};

type Options = {
  signal: AbortSignal;
  onStage: (stage: ScanStage) => void;
  onProgress: (fraction: number) => void;
  now?: Date;
};

function checkAborted(signal: AbortSignal) {
  if (signal.aborted) throw new ScanAborted();
}

async function suggestCategory(name: string): Promise<string | null> {
  try {
    const [match] = await merchantsApi.resolve([{ description: name, type: 'EXPENSE' }]);
    return match?.categoryId ?? null;
  } catch {
    return null;
  }
}

export async function scanReceipt(image: PreparedImage, { signal, onStage, onProgress, now }: Options): Promise<ScanResult> {
  onStage('qr');
  const qr = parseNfceQr((await readQrCode(image).catch(() => null)) ?? '');
  checkAborted(signal);

  onStage('text');
  let text: ReceiptText | null = null;
  let problem: ScanProblem | null = null;
  try {
    text = parseReceiptText(await recognizeText(image.ocr, onProgress, signal), now);
  } catch (error) {
    if (error instanceof ScanAborted) throw error;
    problem = isOffline() ? 'offline' : 'ocr';
  }

  onStage('company');
  const cnpj = qr?.cnpj ?? text?.cnpj;
  const company = cnpj ? await merchantsApi.company(cnpj).catch(() => null) : null;
  checkAborted(signal);
  const receipt = mergeReceipt(qr, text, company);
  const categoryId = receipt.merchantName ? await suggestCategory(receipt.merchantName) : null;
  checkAborted(signal);

  const { total, date, cnpj: hasCnpj, name } = receipt.found;
  if (!problem && !total && !date && !hasCnpj && !name) problem = 'unreadable';
  return { receipt, categoryId, problem };
}
