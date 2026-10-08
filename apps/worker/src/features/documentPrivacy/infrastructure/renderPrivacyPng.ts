import sharp from 'sharp';
import { ImageConversionError } from '../../extraction/application/ImageConversionError.js';
import { readHeicImage } from '../../extraction/infrastructure/readHeicImage.js';
import { mapPrivacyEdits } from '../domain/mapPrivacyEdits.js';
import type { PrivacyRectangle } from '../domain/PrivacyEdits.js';
import { validatePrivacyEdits } from '../domain/validatePrivacyEdits.js';
const MAX_BYTES = 10 * 1024 * 1024;
const MIME_TYPES = ['image/heic', 'image/jpeg', 'image/png', 'image/webp'];

// Chỉ chạy trong child có timeout/slot chung; luôn xử lý byte gốc, giữ đầy đủ pixel vùng cắt.
export async function renderPrivacyPng(
  bytes: Uint8Array,
  mimeType: string,
  edits: unknown,
): Promise<Uint8Array> {
  if (!MIME_TYPES.includes(mimeType) || bytes.byteLength === 0 || bytes.byteLength > MAX_BYTES)
    throw new ImageConversionError();
  try {
    validatePrivacyEdits(edits);
    sharp.concurrency(1);
    sharp.cache(false);
    const raw = mimeType === 'image/heic' ? await readHeicImage(bytes) : null;
    const image = raw
      ? sharp(raw.data, { raw: { width: raw.width, height: raw.height, channels: 4 } })
      : sharp(bytes, { limitInputPixels: 13_000_000, failOn: 'warning' });
    const metadata = await image.metadata();
    if (
      !metadata.width ||
      !metadata.height ||
      metadata.width > 13_000_000 / metadata.height ||
      (metadata.pages ?? 1) !== 1 ||
      (!raw && `image/${metadata.format}` !== mimeType)
    )
      throw new ImageConversionError();
    const { data, info } = await image
      .autoOrient()
      .rotate(edits.rotation)
      .flatten({ background: '#ffffff' })
      .removeAlpha()
      .toColourspace('srgb')
      .raw()
      .toBuffer({ resolveWithObject: true });
    if (info.channels !== 3) throw new ImageConversionError();
    const mapped = mapPrivacyEdits(edits, info.width, info.height);
    paintMasks(data, info.width, mapped.masks);
    const output = await sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } })
      .extract(mapped.crop)
      .png()
      .toBuffer();
    if (output.byteLength > MAX_BYTES) throw new ImageConversionError();
    return output;
  } catch {
    throw new ImageConversionError();
  }
}
function paintMasks(data: Buffer, width: number, masks: PrivacyRectangle[]): void {
  for (const mask of masks) {
    for (let row = mask.top; row < mask.top + mask.height; row++) {
      const offset = (row * width + mask.left) * 3;
      data.fill(0, offset, offset + mask.width * 3);
    }
  }
}
