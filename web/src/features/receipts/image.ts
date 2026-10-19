export const MAX_SIDE = 1600;
export const JPEG_QUALITY = 0.7;

const THRESHOLD_WINDOW_DIVISOR = 32;
const THRESHOLD_MIN_RADIUS = 8;
const THRESHOLD_SENSITIVITY = 0.1;
const QR_REGIONS = [
  { x: 0, y: 0, width: 1, height: 1 },
  { x: 0.2, y: 0.2, width: 0.6, height: 0.6 },
  { x: 0.15, y: 0.5, width: 0.7, height: 0.5 },
];

export type PreparedImage = {
  photo: File;
  previewUrl: string;
  ocr: HTMLCanvasElement;
  source: CanvasImageSource;
  width: number;
  height: number;
};

export class ImageError extends Error {}

export function fitSize(width: number, height: number, max = MAX_SIDE) {
  const scale = Math.min(1, max / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

const pad = (value: number) => String(value).padStart(2, '0');

export function receiptFileName(now: Date): string {
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `nota-${day}-${pad(now.getHours())}${pad(now.getMinutes())}.jpg`;
}

export function enhanceForOcr(pixels: Uint8ClampedArray, width: number, height: number): void {
  const stride = width + 1;
  const integral = new Float64Array(stride * (height + 1));
  const gray = new Uint8ClampedArray(width * height);
  for (let y = 0; y < height; y++) {
    let row = 0;
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 4;
      const value = 0.299 * pixels[offset] + 0.587 * pixels[offset + 1] + 0.114 * pixels[offset + 2];
      gray[y * width + x] = value;
      row += value;
      integral[(y + 1) * stride + x + 1] = integral[y * stride + x + 1] + row;
    }
  }
  const half = Math.max(THRESHOLD_MIN_RADIUS, Math.round(Math.max(width, height) / THRESHOLD_WINDOW_DIVISOR / 2));
  for (let y = 0; y < height; y++) {
    const top = Math.max(0, y - half);
    const bottom = Math.min(height, y + half + 1);
    for (let x = 0; x < width; x++) {
      const left = Math.max(0, x - half);
      const right = Math.min(width, x + half + 1);
      const sum =
        integral[bottom * stride + right] - integral[top * stride + right] - integral[bottom * stride + left] + integral[top * stride + left];
      const mean = sum / ((right - left) * (bottom - top));
      const offset = (y * width + x) * 4;
      const value = gray[y * width + x] < mean * (1 - THRESHOLD_SENSITIVITY) ? 0 : 255;
      pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = value;
      pixels[offset + 3] = 255;
    }
  }
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(file);
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ImageError('unreadable image'));
    };
    image.src = url;
  });
}

function canvasOf(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  if (!context) throw new ImageError('canvas unavailable');
  return { canvas, context };
}

function toJpeg(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new ImageError('jpeg encoding failed'))),
      'image/jpeg',
      JPEG_QUALITY
    )
  );
}

export async function prepareImage(file: Blob, now: Date = new Date()): Promise<PreparedImage> {
  const image = await loadImage(file);
  const width = image.naturalWidth;
  const height = image.naturalHeight;
  if (!width || !height) throw new ImageError('empty image');
  const size = fitSize(width, height);
  const photo = canvasOf(size.width, size.height);
  photo.context.drawImage(image, 0, 0, size.width, size.height);
  const jpeg = new File([await toJpeg(photo.canvas)], receiptFileName(now), { type: 'image/jpeg' });
  const pixels = photo.context.getImageData(0, 0, size.width, size.height);
  enhanceForOcr(pixels.data, size.width, size.height);
  const ocr = canvasOf(size.width, size.height);
  ocr.context.putImageData(pixels, 0, 0);
  return { photo: jpeg, previewUrl: URL.createObjectURL(jpeg), ocr: ocr.canvas, source: image, width, height };
}

export function releaseImage(image: PreparedImage | null): void {
  if (image) URL.revokeObjectURL(image.previewUrl);
}

export async function readQrCode(image: PreparedImage): Promise<string | null> {
  const { default: jsQR } = await import('jsqr');
  for (const region of QR_REGIONS) {
    const sx = Math.round(image.width * region.x);
    const sy = Math.round(image.height * region.y);
    const sw = Math.round(image.width * region.width);
    const sh = Math.round(image.height * region.height);
    const size = fitSize(sw, sh);
    const { context } = canvasOf(size.width, size.height);
    context.drawImage(image.source, sx, sy, sw, sh, 0, 0, size.width, size.height);
    const { data, width, height } = context.getImageData(0, 0, size.width, size.height);
    const code = jsQR(data, width, height, { inversionAttempts: 'dontInvert' });
    if (code?.data) return code.data;
  }
  return null;
}
