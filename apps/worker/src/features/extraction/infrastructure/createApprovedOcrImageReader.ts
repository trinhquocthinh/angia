import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { withImageProcessingSlot } from './withImageProcessingSlot.js';
import { ImageConversionError } from '../application/ImageConversionError.js';
import type { ApprovedOcrImageReader, ObjectReader } from '../application/ports.js';

// Bản đã duyệt phải là ảnh chuẩn hóa không metadata. Không tự strip lại vì sẽ đổi hash mà người dùng đã duyệt.
export function createApprovedOcrImageReader(reader: ObjectReader): ApprovedOcrImageReader {
  return {
    get: async (key) => {
      const bytes = await reader.get(key);
      return withImageProcessingSlot(async () => {
        try {
          if (bytes.length === 0 || bytes.length > 10 * 1024 * 1024) throw new ImageConversionError();
          const metadata = await sharp(bytes, { limitInputPixels: 13_000_000 }).metadata();
          if (
            !metadata.format ||
            !['jpeg', 'png', 'webp'].includes(metadata.format) ||
            (metadata.pages ?? 1) !== 1 ||
            metadata.exif ||
            metadata.icc ||
            metadata.xmp ||
            metadata.iptc
          )
            throw new ImageConversionError();
          return {
            bytes,
            mimeType: `image/${metadata.format}`,
            sha256: createHash('sha256').update(bytes).digest('hex'),
          };
        } catch {
          throw new ImageConversionError();
        }
      });
    },
  };
}
