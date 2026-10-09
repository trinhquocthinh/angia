import { randomBytes } from 'node:crypto';
import sharp from 'sharp';
import { expect, it } from 'vitest';
import { renderPrivacyPng } from './renderPrivacyPng.js';
const full = { left: 0, top: 0, width: 1_000_000, height: 1_000_000 };
const edits = { rotation: 0 as const, crop: full, masks: [] };
const image = async (width: number, height: number, alpha = 1) =>
  sharp({ create: { width, height, channels: 4, background: { r: 200, g: 100, b: 50, alpha } } })
    .png()
    .toBuffer();
it('TC-182: PNG cắt từ ảnh gốc đủ pixel, vùng che đen đặc và nền trong suốt thành trắng', async () => {
  const output = await renderPrivacyPng(await image(10, 8, 0), 'image/png', {
    ...edits,
    crop: { left: 200_000, top: 0, width: 600_000, height: 1_000_000 },
    masks: [{ left: 300_000, top: 250_000, width: 200_000, height: 250_000 }],
  });
  const { data, info } = await sharp(output).raw().toBuffer({ resolveWithObject: true });
  expect(info).toMatchObject({ width: 6, height: 8, channels: 3 });
  expect([...data.subarray(0, 3)]).toEqual([255, 255, 255]);
  const pixel = (x: number, y: number) => [
    ...data.subarray((y * info.width + x) * 3, (y * info.width + x) * 3 + 3),
  ];
  expect(pixel(0, 1)).toEqual([0, 0, 0]);
  expect(pixel(3, 4)).toEqual([0, 0, 0]);
  expect(pixel(4, 4)).toEqual([255, 255, 255]);
});
it('TC-183: auto-orient trước xoay, không metadata, không resize', async () => {
  const original = await sharp(await image(7, 5))
    .jpeg()
    .withMetadata({ orientation: 6 })
    .toBuffer();
  const output = await renderPrivacyPng(original, 'image/jpeg', { ...edits, rotation: 90 });
  const metadata = await sharp(output).metadata();
  expect(metadata).toMatchObject({ format: 'png', width: 7, height: 5 });
  for (const name of ['exif', 'icc', 'xmp', 'iptc', 'orientation'])
    expect(metadata[name as keyof typeof metadata]).toBeUndefined();
});
it('TC-184: chặn đầu vào rỗng/quá 10 MiB/sai MIME/ảnh cắt cụt và hơn 13 triệu pixel', async () => {
  for (const bytes of [
    new Uint8Array(),
    new Uint8Array(10 * 1024 * 1024 + 1),
    new Uint8Array([137, 80, 78, 71]),
  ])
    await expect(renderPrivacyPng(bytes, 'image/png', edits)).rejects.toThrow();
  await expect(renderPrivacyPng(await image(2, 2), 'image/jpeg', edits)).rejects.toThrow();
  await expect(renderPrivacyPng(await image(4000, 4000), 'image/png', edits)).rejects.toThrow();
});
it('TC-185: PNG trên 10 MiB bị từ chối, không giảm pixel hoặc chất lượng để né giới hạn', async () => {
  const original = await sharp(randomBytes(2200 * 2200 * 3), {
    raw: { width: 2200, height: 2200, channels: 3 },
  })
    .jpeg({ quality: 95 })
    .toBuffer();
  expect(original.length).toBeLessThan(10 * 1024 * 1024);
  await expect(renderPrivacyPng(original, 'image/jpeg', edits)).rejects.toThrow();
});
it('TC-225: nén ảnh có tương quan không làm đổi pixel và giảm dung lượng PNG', async () => {
  const width = 512,
    height = 512;
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const offset = (y * width + x) * 3;
      pixels[offset] = (x * 73 + y * 17) % 256;
      pixels[offset + 1] = (x * 91 + y * 11) % 256;
      pixels[offset + 2] = (x * 23 + y * 7) % 256;
    }
  const original = await sharp(pixels, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer();
  const output = await renderPrivacyPng(original, 'image/png', edits);
  expect(output.length).toBeLessThan(original.length * 0.5);
  expect(await sharp(output).raw().toBuffer()).toEqual(pixels);
});
