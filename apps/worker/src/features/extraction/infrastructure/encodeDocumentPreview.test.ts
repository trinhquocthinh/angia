import sharp from 'sharp';
import { expect, it } from 'vitest';
import { encodeDocumentPreview } from './encodeDocumentPreview.js';

it.each(['jpeg', 'png', 'webp'] as const)(
  'TC-138: %s sinh WebP không phóng to, bỏ metadata',
  async (format) => {
    const input = await sharp({ create: { width: 64, height: 32, channels: 3, background: '#ff0000' } })
      .withMetadata()
      .toFormat(format)
      .toBuffer();
    const output = await encodeDocumentPreview(input, `image/${format}`);
    const metadata = await sharp(output).metadata();
    expect(metadata.format).toBe('webp');
    expect([metadata.width, metadata.height]).toEqual([64, 32]);
    expect(metadata.exif).toBeUndefined();
    expect(metadata.icc).toBeUndefined();
  },
);

it('TC-139: ảnh cạnh dài hơn 1800 được thu nhỏ trong khung 1800×1800', async () => {
  const input = await sharp({ create: { width: 2000, height: 1000, channels: 3, background: '#ffffff' } })
    .png()
    .toBuffer();
  const output = await encodeDocumentPreview(input, 'image/png');
  const metadata = await sharp(output).metadata();
  expect([metadata.width, metadata.height]).toEqual([1800, 900]);
  expect(output.length).toBeLessThanOrEqual(200000);
});

it('TC-140: MIME không hỗ trợ, byte rỗng/hỏng/quá trần không tạo preview', async () => {
  for (const [bytes, mime] of [
    [new Uint8Array([1]), 'image/svg+xml'],
    [new Uint8Array(), 'image/png'],
    [new Uint8Array([1, 2, 3]), 'image/jpeg'],
    [new Uint8Array(10 * 1024 * 1024 + 1), 'image/png'],
  ] as const) {
    await expect(encodeDocumentPreview(bytes, mime)).rejects.toThrow('image_unusable');
  }
});

it('TC-143: PNG trên 13 triệu pixel bị chặn trước encode preview', async () => {
  const input = await sharp({ create: { width: 5200, height: 2600, channels: 3, background: '#ffffff' } })
    .png()
    .toBuffer();
  expect(input.length).toBeLessThan(10 * 1024 * 1024);
  await expect(encodeDocumentPreview(input, 'image/png')).rejects.toThrow('image_unusable');
});
