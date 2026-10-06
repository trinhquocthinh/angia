import heicDecode from 'heic-decode';
import sharp from 'sharp';
import type { ImageConverter } from '../application/ports.js';

// Spike E1-S1-T2: điểm ảnh RGBA từ libheif WASM đưa thẳng vào sharp (1.6 s, RSS đỉnh 338 MB với ảnh 12 MP).
export function createHeicImageConverter(): ImageConverter {
  return {
    heicToJpeg: async (bytes) => {
      const { width, height, data } = await heicDecode({ buffer: bytes });
      const jpeg = await sharp(data, { raw: { width, height, channels: 4 } })
        .jpeg({ quality: 90 })
        .toBuffer();
      return new Uint8Array(jpeg);
    },
  };
}
