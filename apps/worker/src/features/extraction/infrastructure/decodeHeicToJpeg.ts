import sharp from 'sharp';
import { ImageConversionError } from '../application/ImageConversionError.js';
import { readHeicImage } from './readHeicImage.js';

export async function decodeHeicToJpeg(bytes: Uint8Array): Promise<Uint8Array> {
  try {
    const { width, height, data } = await readHeicImage(bytes);
    return new Uint8Array(
      await sharp(data, { raw: { width, height, channels: 4 } })
        .jpeg({ quality: 90 })
        .toBuffer(),
    );
  } catch {
    throw new ImageConversionError();
  }
}
