import { expect, it } from 'vitest';
import { withImageProcessingSlot } from './withImageProcessingSlot.js';

it('TC-137: tác vụ JPEG/WebP dùng chung một slot và nhả slot khi lỗi', async () => {
  let release!: () => void;
  const events: string[] = [];
  const first = withImageProcessingSlot(async () => {
    events.push('jpeg');
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    throw new Error('lỗi ảnh');
  });
  const checked = expect(first).rejects.toThrow('lỗi ảnh');
  const second = withImageProcessingSlot(async () => {
    events.push('webp');
    return 2;
  });
  await Promise.resolve();
  const beforeRelease = [...events];
  release();
  await checked;
  expect(await second).toBe(2);
  expect(beforeRelease).toEqual(['jpeg']);
  expect(events).toEqual(['jpeg', 'webp']);
});
