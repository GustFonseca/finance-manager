import type { LoggerMessage } from 'tesseract.js';

export const OCR_LANGUAGE = 'por';
const LOADING_SHARE = 0.25;

export class ScanAborted extends Error {
  constructor() {
    super('scan aborted');
    this.name = 'ScanAborted';
  }
}

export function ocrProgress(message: LoggerMessage): number {
  const progress = Number.isFinite(message.progress) ? message.progress : 0;
  return message.status === 'recognizing text'
    ? LOADING_SHARE + (1 - LOADING_SHARE) * progress
    : LOADING_SHARE * progress;
}

export function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new ScanAborted());
      return;
    }
    const onAbort = () => reject(new ScanAborted());
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort));
  });
}

export async function recognizeText(
  image: HTMLCanvasElement,
  onProgress: (fraction: number) => void,
  signal: AbortSignal
): Promise<string> {
  const { createWorker, PSM } = await abortable(import('tesseract.js'), signal);
  const pending = createWorker(OCR_LANGUAGE, 1, { logger: (message) => onProgress(ocrProgress(message)) });
  try {
    const worker = await abortable(pending, signal);
    await abortable(worker.setParameters({ tessedit_pageseg_mode: PSM.SINGLE_BLOCK }), signal);
    const result = await abortable(worker.recognize(image), signal);
    return result.data.text;
  } finally {
    pending.then((worker) => worker.terminate()).catch(() => undefined);
  }
}

export function isOffline(): boolean {
  return typeof navigator !== 'undefined' && navigator.onLine === false;
}
