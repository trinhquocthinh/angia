import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { withImageProcessingSlot } from './withImageProcessingSlot.js';
import { ImageConversionError } from '../application/ImageConversionError.js';
import type { DocumentImageReader, ObjectReader } from '../application/ports.js';

// Migration 0033 giữ PNG OCR đã duyệt; upload mới vẫn chỉ nhận JPEG.
const UUID = '[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}';
const LEGACY_OCR_PNG = new RegExp(
  `^families/${UUID}/(?:documents/${UUID}/ocr\\.png|profiles/${UUID}/documents/${UUID}/ocr/${UUID}/${UUID}\\.png)$`,
);

// Bản đã duyệt phải là ảnh chuẩn hóa không metadata. Không tự strip lại vì sẽ đổi hash mà người dùng đã duyệt.
export function createDocumentImageReader(reader: ObjectReader): DocumentImageReader {
  return {
    get: async (key) => {
      const bytes = await reader.get(key);
      return withImageProcessingSlot(async () => {
        try {
          if (bytes.length === 0 || bytes.length > 10 * 1024 * 1024) throw new ImageConversionError();
          const metadata = await sharp(bytes, { limitInputPixels: 13_000_000 }).metadata();
          if (
            (metadata.format !== 'jpeg' && !(metadata.format === 'png' && LEGACY_OCR_PNG.test(key))) ||
            (metadata.pages ?? 1) !== 1 ||
            metadata.exif ||
            metadata.icc ||
            metadata.xmp ||
            metadata.iptc
          )
            throw new ImageConversionError();
          return {
            bytes,
            mimeType: metadata.format === 'png' ? 'image/png' : 'image/jpeg',
            sha256: createHash('sha256').update(bytes).digest('hex'),
          };
        } catch {
          throw new ImageConversionError();
        }
      });
    },
  };
}
