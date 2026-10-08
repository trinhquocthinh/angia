import sharp from 'sharp';
import { ImageConversionError } from '../application/ImageConversionError.js';
import { readHeicImage } from './readHeicImage.js';

const MIME_TYPES = ['image/heic', 'image/jpeg', 'image/png', 'image/webp'];

// Chỉ tối ưu bản xem trước; không dùng các byte này làm ảnh OCR đã duyệt.
export async function encodeDocumentPreview(bytes: Uint8Array, mimeType: string): Promise<Uint8Array> {
  if (!MIME_TYPES.includes(mimeType) || bytes.byteLength === 0 || bytes.byteLength > 10 * 1024 * 1024) {
    throw new ImageConversionError();
  }
  try {
    sharp.concurrency(1);
    sharp.cache(false);
    const raw = mimeType === 'image/heic' ? await readHeicImage(bytes) : null;
    const image = raw
      ? sharp(raw.data, { raw: { width: raw.width, height: raw.height, channels: 4 } })
      : sharp(bytes, { limitInputPixels: 13_000_000 });
    const metadata = await image.metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > 13_000_000 / metadata.height ||
      (metadata.pages ?? 1) !== 1
    ) {
      throw new ImageConversionError();
    }
    if (!raw && `image/${metadata.format}` !== mimeType) throw new ImageConversionError();
    let output: Buffer | undefined;
    for (const edge of [1800, 1600, 1400]) {
      for (const quality of [80, 70, 60]) {
        output = await image
          .clone()
          .rotate()
          .resize({ width: edge, height: edge, fit: 'inside', withoutEnlargement: true })
          .webp({ quality })
          .toBuffer();
        if (output.length <= 200000) return output;
      }
    }
    if (!output) throw new ImageConversionError();
    return output;
  } catch {
    throw new ImageConversionError();
  }
}
