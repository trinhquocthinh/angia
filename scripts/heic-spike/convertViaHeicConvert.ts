import heicConvert from 'heic-convert';
import sharp from 'sharp';
import type { ConvertedImage } from './pipelines.js';

/** Phương án Tech Spec §1: `heic-convert` (libheif WASM) → JPEG → `sharp` → WebP. */
export const convertViaHeicConvert = async (input: Buffer): Promise<ConvertedImage> => {
  const jpeg = await heicConvert({ buffer: input, format: 'JPEG', quality: 0.92 });
  const { data, info } = await sharp(jpeg).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, outputBytes: data.length };
};
