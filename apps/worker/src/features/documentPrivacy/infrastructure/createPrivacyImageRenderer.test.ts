import { expect, it, vi } from 'vitest';
import { createPrivacyImageRenderer } from './createPrivacyImageRenderer.js';
import { createHeicImageConverter } from '../../extraction/infrastructure/createHeicImageConverter.js';
import { runHeicProcess } from '../../extraction/infrastructure/runHeicProcess.js';
vi.mock('../../extraction/infrastructure/runHeicProcess.js', () => ({ runHeicProcess: vi.fn() }));
const edits = {
  rotation: 0 as const,
  crop: { left: 0, top: 0, width: 1_000_000, height: 1_000_000 },
  masks: [],
};
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
it('TC-193: renderer chặn input trước child và output không PNG; child dùng timeout 30 giây/trần 10 MiB', async () => {
  vi.resetAllMocks();
  const renderer = createPrivacyImageRenderer();
  for (const [bytes, mime] of [
    [new Uint8Array(), 'image/png'],
    [new Uint8Array(10 * 1024 * 1024 + 1), 'image/png'],
    [new Uint8Array([1]), 'image/svg+xml'],
  ] as const)
    await expect(renderer.toPng(bytes, mime, edits)).rejects.toThrow('image_unusable');
  expect(runHeicProcess).not.toHaveBeenCalled();
  vi.mocked(runHeicProcess).mockResolvedValue(new Uint8Array([1]));
  await expect(renderer.toPng(new Uint8Array([1]), 'image/png', edits)).rejects.toThrow('image_unusable');
  vi.mocked(runHeicProcess).mockResolvedValue(png);
  expect(await renderer.toPng(new Uint8Array([1]), 'image/png', edits)).toEqual(png);
  expect(runHeicProcess).toHaveBeenLastCalledWith(
    new Uint8Array([1]),
    expect.arrayContaining(['image/png', JSON.stringify(edits)]),
    30_000,
    10 * 1024 * 1024,
  );
});
it('TC-194: JPEG và PNG dùng cùng slot; không spawn đồng thời', async () => {
  vi.resetAllMocks();
  let release!: () => void;
  const wait = new Promise<void>((resolve) => {
    release = resolve;
  });
  vi.mocked(runHeicProcess).mockImplementationOnce(async () => {
    await wait;
    return new Uint8Array([255, 216]);
  });
  vi.mocked(runHeicProcess).mockResolvedValue(png);
  const jpeg = createHeicImageConverter().heicToJpeg(new Uint8Array([1]));
  const privacy = createPrivacyImageRenderer().toPng(new Uint8Array([1]), 'image/png', edits);
  await Promise.resolve();
  const count = vi.mocked(runHeicProcess).mock.calls.length;
  release();
  await Promise.all([jpeg, privacy]);
  expect(count).toBe(1);
  expect(runHeicProcess).toHaveBeenCalledTimes(2);
});
