import { createWorker } from 'tesseract.js';
import { abortable, isOffline, ocrProgress, recognizeText, ScanAborted } from '../ocr';

jest.mock('tesseract.js', () => ({
  __esModule: true,
  createWorker: jest.fn(),
  PSM: { SINGLE_BLOCK: '6' },
}));

type Logger = (message: { status: string; progress: number }) => void;

const canvas = {} as HTMLCanvasElement;

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function fakeWorker(recognize: Promise<unknown> = Promise.resolve({ data: { text: 'TOTAL 10,00' } })) {
  return {
    setParameters: jest.fn().mockResolvedValue({}),
    recognize: jest.fn(() => recognize),
    terminate: jest.fn().mockResolvedValue({}),
  };
}

const flush = () => new Promise((resolve) => setTimeout(resolve));

describe('ocrProgress', () => {
  it('maps loading to the first quarter and recognition to the rest', () => {
    expect(ocrProgress({ status: 'loading language traineddata', progress: 1 } as never)).toBe(0.25);
    expect(ocrProgress({ status: 'recognizing text', progress: 0.5 } as never)).toBe(0.625);
    expect(ocrProgress({ status: 'initializing api', progress: NaN } as never)).toBe(0);
  });
});

describe('abortable', () => {
  it('resolves, rejects and aborts', async () => {
    await expect(abortable(Promise.resolve(1), new AbortController().signal)).resolves.toBe(1);
    await expect(abortable(Promise.reject(new Error('x')), new AbortController().signal)).rejects.toThrow('x');

    const aborted = new AbortController();
    aborted.abort();
    await expect(abortable(Promise.resolve(1), aborted.signal)).rejects.toBeInstanceOf(ScanAborted);

    const later = new AbortController();
    const pending = abortable(new Promise(() => {}), later.signal);
    later.abort();
    await expect(pending).rejects.toThrow('scan aborted');
  });
});

describe('recognizeText', () => {
  it('reads Portuguese text in single block mode, reports progress and terminates the worker', async () => {
    const worker = fakeWorker();
    let logger: Logger = () => {};
    jest.mocked(createWorker).mockImplementation(async (_lang, _oem, options) => {
      logger = options!.logger as Logger;
      return worker as never;
    });
    const onProgress = jest.fn();

    await expect(recognizeText(canvas, onProgress, new AbortController().signal)).resolves.toBe('TOTAL 10,00');
    logger({ status: 'recognizing text', progress: 1 });

    expect(createWorker).toHaveBeenCalledWith('por', 1, expect.any(Object));
    expect(worker.setParameters).toHaveBeenCalledWith({ tessedit_pageseg_mode: '6' });
    expect(worker.recognize).toHaveBeenCalledWith(canvas);
    expect(onProgress).toHaveBeenCalledWith(1);
    await flush();
    expect(worker.terminate).toHaveBeenCalled();
  });

  it('terminates the worker when cancelled while recognizing', async () => {
    const worker = fakeWorker(new Promise(() => {}));
    jest.mocked(createWorker).mockResolvedValue(worker as never);
    const controller = new AbortController();

    const reading = recognizeText(canvas, jest.fn(), controller.signal);
    await flush();
    controller.abort();

    await expect(reading).rejects.toBeInstanceOf(ScanAborted);
    await flush();
    expect(worker.terminate).toHaveBeenCalled();
  });

  it('terminates a worker that finishes loading after the cancel', async () => {
    const loading = deferred<ReturnType<typeof fakeWorker>>();
    jest.mocked(createWorker).mockReturnValue(loading.promise as never);
    const controller = new AbortController();

    const reading = recognizeText(canvas, jest.fn(), controller.signal);
    await flush();
    controller.abort();
    await expect(reading).rejects.toBeInstanceOf(ScanAborted);

    const worker = fakeWorker();
    loading.resolve(worker);
    await flush();
    expect(worker.terminate).toHaveBeenCalled();
    expect(worker.recognize).not.toHaveBeenCalled();
  });

  it('propagates worker failures', async () => {
    jest.mocked(createWorker).mockRejectedValue(new Error('network'));
    await expect(recognizeText(canvas, jest.fn(), new AbortController().signal)).rejects.toThrow('network');
  });

  it('does not load the worker when already cancelled', async () => {
    const controller = new AbortController();
    controller.abort();
    await expect(recognizeText(canvas, jest.fn(), controller.signal)).rejects.toBeInstanceOf(ScanAborted);
    expect(createWorker).not.toHaveBeenCalled();
  });
});

describe('isOffline', () => {
  it('follows navigator.onLine', () => {
    const spy = jest.spyOn(navigator, 'onLine', 'get');
    spy.mockReturnValue(false);
    expect(isOffline()).toBe(true);
    spy.mockReturnValue(true);
    expect(isOffline()).toBe(false);
    spy.mockRestore();
  });
});
