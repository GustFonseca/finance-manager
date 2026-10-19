import { merchantsApi } from '@/features/merchants/api';
import { PreparedImage, readQrCode } from '../image';
import { isOffline, recognizeText, ScanAborted } from '../ocr';
import { scanReceipt } from '../scan';

jest.mock('@/features/merchants/api');
jest.mock('../image', () => ({ readQrCode: jest.fn() }));
jest.mock('../ocr', () => ({ ...jest.requireActual('../ocr'), recognizeText: jest.fn(), isOffline: jest.fn() }));

const KEY = '43261011222333000181650010000123451000012343';
const NOW = new Date(2026, 9, 19, 12);
const image = { ocr: {} } as PreparedImage;
const merchants = jest.mocked(merchantsApi);

const RECEIPT = 'LOJA DO TESTE\nCNPJ 47.508.011/0001-40\nVALOR A PAGAR R$ 45,90\nEMISSAO 18/10/2026 10:00\nPIX';

function run(controller = new AbortController()) {
  const onStage = jest.fn();
  const onProgress = jest.fn();
  return { onStage, onProgress, result: scanReceipt(image, { signal: controller.signal, onStage, onProgress, now: NOW }) };
}

const match = (categoryId: string | null) => ({
  description: '',
  name: '',
  kind: null,
  merchantId: null,
  categoryId,
  skipReason: null,
});

beforeEach(() => {
  jest.mocked(readQrCode).mockResolvedValue(`https://sefaz/?p=${KEY}|2|1`);
  jest.mocked(recognizeText).mockImplementation(async (_canvas, onProgress) => {
    onProgress(0.5);
    return RECEIPT;
  });
  jest.mocked(isOffline).mockReturnValue(false);
  merchants.company.mockResolvedValue({ cnpj: '11222333000181', name: 'MERCADO CENTRAL', activity: 'Supermercados' });
  merchants.resolve.mockResolvedValue([match('food')]);
});

describe('scanReceipt', () => {
  it('combines the QR Code, the text and the company and suggests a category', async () => {
    const { result, onStage, onProgress } = run();
    const scanned = await result;

    expect(onStage.mock.calls.map(([stage]) => stage)).toEqual(['qr', 'text', 'company']);
    expect(onProgress).toHaveBeenCalledWith(0.5);
    expect(merchants.company).toHaveBeenCalledWith('11222333000181');
    expect(merchants.resolve).toHaveBeenCalledWith([{ description: 'Mercado Central', type: 'EXPENSE' }]);
    expect(scanned).toMatchObject({
      categoryId: 'food',
      problem: null,
      receipt: {
        cnpj: '11222333000181',
        merchantName: 'Mercado Central',
        totalCents: 4590,
        day: '2026-10-18',
        payment: 'PIX',
        accessKey: KEY,
        activity: 'Supermercados',
      },
    });
  });

  it('uses the CNPJ printed on the receipt when there is no QR Code and survives API failures', async () => {
    jest.mocked(readQrCode).mockRejectedValue(new Error('no canvas'));
    merchants.company.mockRejectedValue(new Error('404'));
    merchants.resolve.mockRejectedValue(new Error('offline'));

    const scanned = await run().result;

    expect(merchants.company).toHaveBeenCalledWith('47508011000140');
    expect(scanned).toMatchObject({ categoryId: null, problem: null, receipt: { merchantName: 'Loja do Teste', accessKey: null } });
  });

  it('has no category when the resolver has no match', async () => {
    merchants.resolve.mockResolvedValue([]);
    expect((await run().result).categoryId).toBeNull();
  });

  it('skips the lookups when nothing identifies the store', async () => {
    jest.mocked(readQrCode).mockResolvedValue(null);
    jest.mocked(recognizeText).mockResolvedValue('TOTAL 12,00');

    const scanned = await run().result;

    expect(merchants.company).not.toHaveBeenCalled();
    expect(merchants.resolve).not.toHaveBeenCalled();
    expect(scanned).toMatchObject({ categoryId: null, problem: null, receipt: { totalCents: 1200 } });
  });

  it('reports an unreadable photo', async () => {
    jest.mocked(readQrCode).mockResolvedValue('not a nfce');
    jest.mocked(recognizeText).mockResolvedValue('~~ ### ~~');
    expect((await run().result).problem).toBe('unreadable');
  });

  it('reports OCR failures, offline or not, keeping the QR data', async () => {
    jest.mocked(recognizeText).mockRejectedValue(new Error('wasm'));
    expect(await run().result).toMatchObject({ problem: 'ocr', receipt: { cnpj: '11222333000181', totalCents: null } });

    jest.mocked(isOffline).mockReturnValue(true);
    jest.mocked(readQrCode).mockResolvedValue(null);
    expect((await run().result).problem).toBe('offline');
  });

  it('stops when cancelled during the QR search', async () => {
    const controller = new AbortController();
    jest.mocked(readQrCode).mockImplementation(async () => {
      controller.abort();
      return null;
    });
    await expect(run(controller).result).rejects.toBeInstanceOf(ScanAborted);
    expect(recognizeText).not.toHaveBeenCalled();
  });

  it('stops when the OCR is cancelled', async () => {
    jest.mocked(recognizeText).mockRejectedValue(new ScanAborted());
    await expect(run().result).rejects.toBeInstanceOf(ScanAborted);
    expect(merchants.company).not.toHaveBeenCalled();
  });

  it('stops when cancelled during the company lookup', async () => {
    const controller = new AbortController();
    merchants.company.mockImplementation(async () => {
      controller.abort();
      return { cnpj: '', name: null, activity: '' };
    });
    await expect(run(controller).result).rejects.toBeInstanceOf(ScanAborted);
    expect(merchants.resolve).not.toHaveBeenCalled();
  });

  it('stops when cancelled during the category suggestion', async () => {
    const controller = new AbortController();
    merchants.resolve.mockImplementation(async () => {
      controller.abort();
      return [];
    });
    await expect(run(controller).result).rejects.toBeInstanceOf(ScanAborted);
  });
});
