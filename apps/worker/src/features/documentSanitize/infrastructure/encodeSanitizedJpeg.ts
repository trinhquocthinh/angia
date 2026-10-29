import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { ImageConversionError } from '../../extraction/application/ImageConversionError.js';
import type { SanitizedJpeg } from '../application/ports.js';

export async function encodeSanitizedJpeg(input: Uint8Array): Promise<SanitizedJpeg> {
  if (!input.byteLength || input.byteLength > 10 * 1024 * 1024) throw new ImageConversionError();
  try {
    sharp.concurrency(1);
    sharp.cache(false);
    const image = sharp(input, { limitInputPixels: 13_000_000 });
    const metadata = await image.metadata();
    if (
      metadata.format !== 'jpeg' ||
      !metadata.width ||
      !metadata.height ||
      metadata.width > 13_000_000 / metadata.height ||
      (metadata.pages ?? 1) !== 1
    )
      throw new ImageConversionError();
    const bytes = await image.rotate().jpeg({ quality: 92, mozjpeg: true }).toBuffer();
    return { bytes, sha256: createHash('sha256').update(bytes).digest('hex') };
  } catch {
    throw new ImageConversionError();
  }
}
