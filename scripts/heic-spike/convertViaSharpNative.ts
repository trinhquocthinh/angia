import sharp from 'sharp';
import type { ConvertedImage } from './pipelines.js';

/** Đối chứng: libvips dựng sẵn của `sharp` chỉ kèm AV1 (AVIF), dự kiến không giải được HEVC của iPhone. */
export const convertViaSharpNative = async (input: Buffer): Promise<ConvertedImage> => {
  const { data, info } = await sharp(input).webp({ quality: 80 }).toBuffer({ resolveWithObject: true });
  return { width: info.width, height: info.height, outputBytes: data.length };
};
