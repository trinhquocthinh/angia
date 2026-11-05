import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { expect, it } from 'vitest';
import { createJpegSanitizer } from './createJpegSanitizer.js';

it('TC-415: adapter chạy child thật trả JPEG sạch và hash đúng', async () => {
  const input = await sharp({ create: { width: 8, height: 4, channels: 3, background: 'white' } })
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();
  const output = await createJpegSanitizer().sanitize(input);
  const metadata = await sharp(output.bytes).metadata();
  expect(metadata).toMatchObject({ format: 'jpeg', width: 4, height: 8 });
  expect(metadata.exif).toBeUndefined();
  expect(output.sha256).toBe(createHash('sha256').update(output.bytes).digest('hex'));
  await expect(createJpegSanitizer().sanitize(new Uint8Array([1, 2]))).rejects.toThrow('image_unusable');
});
