import sharp from 'sharp';
import { expect, it, vi } from 'vitest';
import { createJpegSanitizer } from './createJpegSanitizer.js';
import { runJpegProcess } from './runJpegProcess.js';
import { createDocumentImageReader } from '../../extraction/infrastructure/createDocumentImageReader.js';
vi.mock('./runJpegProcess.js', () => ({ runJpegProcess: vi.fn() }));

it('TC-415: JPEG sanitizer và reader OCR dùng chung một slot', async () => {
  const jpeg = await sharp({ create: { width: 2, height: 2, channels: 3, background: '#ffffff' } })
    .jpeg()
    .toBuffer();
  let release!: () => void;
  let entered!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  const started = new Promise<void>((resolve) => {
    entered = resolve;
  });
  vi.mocked(runJpegProcess).mockImplementation(async () => {
    entered();
    await pending;
    return jpeg;
  });
  const sanitized = createJpegSanitizer().sanitize(jpeg);
  await started;
  let readCompleted = false;
  const read = createDocumentImageReader({ get: async () => jpeg })
    .get('key')
    .then((image) => {
      readCompleted = true;
      return image;
    });
  try {
    await new Promise<void>((resolve) => setImmediate(resolve));
    expect(readCompleted).toBe(false);
  } finally {
    release();
    await Promise.all([sanitized, read]);
  }
  expect(readCompleted).toBe(true);
});
