import { createHash } from 'node:crypto';
import sharp from 'sharp';
import { expect, it } from 'vitest';
import { encodeSanitizedJpeg } from './encodeSanitizedJpeg.js';

it('TC-415: loại EXIF GPS, ICC, XMP, IPTC; giữ kích thước và SHA đúng byte', async () => {
  const input = await sharp({ create: { width: 8, height: 4, channels: 3, background: 'white' } })
    .withExifMerge({
      IFD0: { Artist: 'Mẫu riêng tư' },
      IFD3: { GPSLatitudeRef: 'N', GPSLatitude: '10/1 0/1 0/1' },
    })
    .withIccProfile('srgb')
    .withXmp('<x:xmpmeta xmlns:x="adobe:ns:meta/">private</x:xmpmeta>')
    .jpeg()
    .toBuffer();
  const meta = await sharp(input).metadata();
  expect(meta.exif).toBeDefined();
  expect(meta.icc).toBeDefined();
  expect(meta.xmp).toBeDefined();
  const result = await encodeSanitizedJpeg(input);
  const output = await sharp(result.bytes).metadata();
  expect(output).toMatchObject({ width: 8, height: 4, format: 'jpeg' });
  for (const key of ['exif', 'icc', 'xmp', 'iptc'] as const) expect(output[key]).toBeUndefined();
  expect(result.sha256).toBe(createHash('sha256').update(result.bytes).digest('hex'));
});

it('TC-415: auto-orient trước khi bỏ metadata', async () => {
  const input = await sharp({ create: { width: 8, height: 4, channels: 3, background: 'white' } })
    .withMetadata({ orientation: 6 })
    .jpeg()
    .toBuffer();
  const result = await encodeSanitizedJpeg(input);
  expect(await sharp(result.bytes).metadata()).toMatchObject({ width: 4, height: 8 });
});

it('TC-417: từ chối ảnh hỏng, PNG giả JPEG, quá byte và quá pixel', async () => {
  const image = sharp({ create: { width: 4000, height: 4000, channels: 3, background: 'white' } });
  for (const input of [
    new Uint8Array(),
    new Uint8Array([0xff, 0xd8]),
    new Uint8Array(10 * 1024 * 1024 + 1),
    await image.clone().png().toBuffer(),
    await image.jpeg().toBuffer(),
  ]) {
    await expect(encodeSanitizedJpeg(input)).rejects.toThrow('image_unusable');
  }
});
