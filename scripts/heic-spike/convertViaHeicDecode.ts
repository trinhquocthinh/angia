import heicDecode from 'heic-decode';
import sharp from 'sharp';
import type { ConvertedImage } from './pipelines.js';

/** Biến thể bỏ bước mã hoá JPEG thuần JS: điểm ảnh RGBA từ libheif WASM đưa thẳng vào `sharp`. */
export const convertViaHeicDecode = async (input: Buffer): Promise<ConvertedImage> => {
  const { width, height, data } = await heicDecode({ buffer: input });
  const output = await sharp(data, { raw: { width, height, channels: 4 } })
    .webp({ quality: 80 })
    .toBuffer();
  return { width, height, outputBytes: output.length };
};
