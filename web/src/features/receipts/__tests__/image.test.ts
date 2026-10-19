import jsQR from 'jsqr';
import {
  enhanceForOcr,
  fitSize,
  ImageError,
  JPEG_QUALITY,
  PreparedImage,
  prepareImage,
  readQrCode,
  receiptFileName,
  releaseImage,
} from '../image';

jest.mock('jsqr', () => ({ __esModule: true, default: jest.fn() }));

type FakeContext = {
  drawImage: jest.Mock;
  getImageData: jest.Mock;
  putImageData: jest.Mock;
};

type FakeCanvas = {
  width: number;
  height: number;
  context: FakeContext | null;
  getContext: jest.Mock;
  toBlob: jest.Mock;
};

let canvases: FakeCanvas[];
let blob: Blob | null;
let contextAvailable: boolean;
let imageBehavior: { fail: boolean; width: number; height: number };

function pixels(width: number, height: number) {
  return { data: new Uint8ClampedArray(width * height * 4).fill(200), width, height };
}

const createElement = document.createElement.bind(document);

beforeEach(() => {
  canvases = [];
  blob = new Blob(['jpeg'], { type: 'image/jpeg' });
  contextAvailable = true;
  imageBehavior = { fail: false, width: 3200, height: 2400 };
  jest.spyOn(document, 'createElement').mockImplementation(((tag: string) => {
    if (tag !== 'canvas') return createElement(tag);
    const canvas: FakeCanvas = {
      width: 0,
      height: 0,
      context: null,
      getContext: jest.fn(() => {
        if (!contextAvailable) return null;
        canvas.context = {
          drawImage: jest.fn(),
          getImageData: jest.fn((_x: number, _y: number, w: number, h: number) => pixels(w, h)),
          putImageData: jest.fn(),
        };
        return canvas.context;
      }),
      toBlob: jest.fn((callback: (value: Blob | null) => void) => callback(blob)),
    };
    canvases.push(canvas);
    return canvas as unknown as HTMLCanvasElement;
  }) as typeof document.createElement);

  class FakeImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = imageBehavior.width;
    naturalHeight = imageBehavior.height;
    set src(_value: string) {
      setTimeout(() => (imageBehavior.fail ? this.onerror?.() : this.onload?.()));
    }
  }
  (globalThis as { Image: unknown }).Image = FakeImage;
  URL.createObjectURL = jest.fn(() => 'blob:preview');
  URL.revokeObjectURL = jest.fn();
});

afterEach(() => jest.restoreAllMocks());

describe('fitSize', () => {
  it('downscales the long side and never upscales', () => {
    expect(fitSize(3200, 2400)).toEqual({ width: 1600, height: 1200 });
    expect(fitSize(1000, 4000)).toEqual({ width: 400, height: 1600 });
    expect(fitSize(800, 600)).toEqual({ width: 800, height: 600 });
    expect(fitSize(10000, 1)).toEqual({ width: 1600, height: 1 });
  });
});

describe('receiptFileName', () => {
  it('names the photo with the date and time', () => {
    expect(receiptFileName(new Date(2026, 9, 5, 8, 7))).toBe('nota-2026-10-05-0807.jpg');
  });
});

describe('enhanceForOcr', () => {
  it('turns dark strokes black and paper white with a local threshold', () => {
    const data = new Uint8ClampedArray(4 * 4 * 4).fill(220);
    data.set([40, 40, 40, 128], 5 * 4);
    enhanceForOcr(data, 4, 4);
    expect(Array.from(data.slice(5 * 4, 6 * 4))).toEqual([0, 0, 0, 255]);
    expect(Array.from(data.slice(0, 4))).toEqual([255, 255, 255, 255]);
  });

  it('keeps a uniform image white', () => {
    const data = new Uint8ClampedArray(2 * 2 * 4).fill(90);
    enhanceForOcr(data, 2, 2);
    expect(Array.from(new Set(data))).toEqual([255]);
  });
});

describe('prepareImage', () => {
  it('downscales the photo, encodes a JPEG and builds the OCR canvas', async () => {
    const file = new File(['raw'], 'IMG_0001.HEIC', { type: 'image/heic' });
    const prepared = await prepareImage(file, new Date(2026, 9, 19, 14, 30));

    const [photo, ocr] = canvases;
    expect([photo.width, photo.height]).toEqual([1600, 1200]);
    expect(photo.context!.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, 1600, 1200);
    expect(photo.toBlob).toHaveBeenCalledWith(expect.any(Function), 'image/jpeg', JPEG_QUALITY);
    expect(ocr.context!.putImageData).toHaveBeenCalledWith(expect.objectContaining({ width: 1600, height: 1200 }), 0, 0);
    expect(prepared.photo.name).toBe('nota-2026-10-19-1430.jpg');
    expect(prepared.photo.type).toBe('image/jpeg');
    expect(prepared).toMatchObject({ previewUrl: 'blob:preview', width: 3200, height: 2400 });
    expect(prepared.ocr).toBe(ocr);
    expect(URL.revokeObjectURL).toHaveBeenCalledTimes(1);
  });

  it('uses the current time by default', async () => {
    const prepared = await prepareImage(new Blob(['raw']));
    expect(prepared.photo.name).toMatch(/^nota-\d{4}-\d{2}-\d{2}-\d{4}\.jpg$/);
  });

  it('rejects images the browser cannot decode', async () => {
    imageBehavior.fail = true;
    await expect(prepareImage(new Blob(['x']))).rejects.toBeInstanceOf(ImageError);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });

  it('rejects empty images', async () => {
    imageBehavior.width = 0;
    await expect(prepareImage(new Blob(['x']))).rejects.toThrow('empty image');
  });

  it('rejects when the canvas is unavailable or the JPEG cannot be encoded', async () => {
    contextAvailable = false;
    await expect(prepareImage(new Blob(['x']))).rejects.toThrow('canvas unavailable');
    contextAvailable = true;
    blob = null;
    await expect(prepareImage(new Blob(['x']))).rejects.toThrow('jpeg encoding failed');
  });
});

describe('releaseImage', () => {
  it('revokes the preview url', () => {
    releaseImage(null);
    expect(URL.revokeObjectURL).not.toHaveBeenCalled();
    releaseImage({ previewUrl: 'blob:x' } as PreparedImage);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
  });
});

describe('readQrCode', () => {
  const image = { source: {}, width: 1000, height: 2000 } as PreparedImage;
  const decode = jest.mocked(jsQR);

  it('tries the whole photo first and then the crops', async () => {
    decode.mockReturnValueOnce(null).mockReturnValueOnce({ data: 'https://sefaz/?p=123' } as ReturnType<typeof jsQR>);

    await expect(readQrCode(image)).resolves.toBe('https://sefaz/?p=123');

    expect(canvases[0].context!.drawImage).toHaveBeenCalledWith(image.source, 0, 0, 1000, 2000, 0, 0, 800, 1600);
    expect(canvases[1].context!.drawImage).toHaveBeenCalledWith(image.source, 200, 400, 600, 1200, 0, 0, 600, 1200);
    expect(decode).toHaveBeenCalledWith(expect.any(Uint8ClampedArray), 800, 1600, { inversionAttempts: 'dontInvert' });
  });

  it('returns null when no region has a QR Code', async () => {
    decode.mockReturnValue(null);
    await expect(readQrCode(image)).resolves.toBeNull();
    expect(canvases).toHaveLength(3);
    expect(canvases[2].context!.drawImage).toHaveBeenCalledWith(image.source, 150, 1000, 700, 1000, 0, 0, 700, 1000);
  });
});
