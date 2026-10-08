import { beforeEach, expect, it, vi } from 'vitest';
import { createDocumentPreviewConverter } from './createDocumentPreviewConverter.js';
import { createHeicImageConverter } from './createHeicImageConverter.js';
import { runHeicProcess } from './runHeicProcess.js';
vi.mock('./runHeicProcess.js', () => ({ runHeicProcess: vi.fn() }));
beforeEach(() => vi.resetAllMocks());
const webp = new Uint8Array(Buffer.from('RIFF0000WEBP'));

it('TC-141: preview kiểm byte/MIME trước child và từ chối output không phải WebP', async () => {
  const converter = createDocumentPreviewConverter();
  for (const [bytes, mime] of [
    [new Uint8Array(), 'image/png'],
    [new Uint8Array([1]), 'image/svg+xml'],
  ] as const) {
    await expect(converter.toWebp(bytes, mime)).rejects.toThrow('image_unusable');
  }
  expect(runHeicProcess).not.toHaveBeenCalled();
  vi.mocked(runHeicProcess).mockResolvedValue(new Uint8Array([1]));
  await expect(converter.toWebp(new Uint8Array([1]), 'image/png')).rejects.toThrow('image_unusable');
});

it('TC-142: hai adapter JPEG và WebP dùng chung slot, không spawn cùng lúc', async () => {
  let release!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  vi.mocked(runHeicProcess).mockImplementationOnce(async () => {
    await wait;
    return new Uint8Array([0xff, 0xd8]);
  });
  vi.mocked(runHeicProcess).mockResolvedValue(webp);
  const jpeg = createHeicImageConverter().heicToJpeg(new Uint8Array([1]));
  const preview = createDocumentPreviewConverter().toWebp(new Uint8Array([1]), 'image/heic');
  await Promise.resolve();
  const callsBeforeRelease = vi.mocked(runHeicProcess).mock.calls.length;
  release();
  await Promise.all([jpeg, preview]);
  expect(callsBeforeRelease).toBe(1);
  expect(runHeicProcess).toHaveBeenCalledTimes(2);
});
