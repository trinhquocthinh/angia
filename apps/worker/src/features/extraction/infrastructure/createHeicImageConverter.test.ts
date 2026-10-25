import { beforeEach, expect, it, vi } from 'vitest';
import { createHeicImageConverter } from './createHeicImageConverter.js';
import { runHeicProcess } from './runHeicProcess.js';
vi.mock('./runHeicProcess.js', () => ({ runHeicProcess: vi.fn() }));
beforeEach(() => vi.resetAllMocks());

it('TC-133: chặn byte trước spawn và không nhận output sai định dạng JPEG', async () => {
  const converter = createHeicImageConverter();
  for (const bytes of [new Uint8Array(), new Uint8Array(10 * 1024 * 1024 + 1)]) {
    await expect(converter.heicToJpeg(bytes)).rejects.toThrow('image_unusable');
  }
  expect(runHeicProcess).not.toHaveBeenCalled();
  vi.mocked(runHeicProcess).mockResolvedValue(new Uint8Array([1, 2]));
  await expect(converter.heicToJpeg(new Uint8Array([1]))).rejects.toThrow('image_unusable');
});

it('TC-134: đường source dùng tsx và trả byte JPEG của tiến trình con', async () => {
  const jpeg = new Uint8Array([0xff, 0xd8, 0xff, 0xd9]);
  vi.mocked(runHeicProcess).mockResolvedValue(jpeg);
  expect(await createHeicImageConverter().heicToJpeg(new Uint8Array([1]))).toEqual(jpeg);
  expect(vi.mocked(runHeicProcess).mock.calls[0]?.[1].slice(0, 2)).toEqual(['--import', 'tsx']);
});
