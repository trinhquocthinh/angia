import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { expect, it } from 'vitest';
import { createApprovedOcrImageReader } from './createApprovedOcrImageReader.js';

it('TC-153: ảnh chuẩn hóa → trả byte, MIME thực tế và SHA-256 chính xác', async () => {
  const bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } })
    .jpeg()
    .toBuffer();
  const image = await createApprovedOcrImageReader({ get: async () => bytes }).get('k');
  expect(image).toEqual({
    bytes,
    mimeType: 'image/jpeg',
    sha256: createHash('sha256').update(bytes).digest('hex'),
  });
});
it('TC-154: metadata hiện diện hoặc byte ảnh lỗi → từ chối bản OCR dù đã có xác nhận', async () => {
  const bytes = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } })
    .withMetadata()
    .jpeg()
    .toBuffer();
  for (const input of [bytes, new Uint8Array([1, 2, 3])]) {
    await expect(createApprovedOcrImageReader({ get: async () => input }).get('k')).rejects.toThrow(
      'image_unusable',
    );
  }
});
