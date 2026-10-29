import { describe, expect, it, vi } from 'vitest';
import { heicToDisplayable } from './heicToDisplayable';

const heic = vi.hoisted(() => ({ loaded: false, jpeg: { size: 1, type: 'image/jpeg' } as Blob }));
vi.mock('heic-to', () => {
  heic.loaded = true;
  return { heicTo: vi.fn(async () => heic.jpeg) };
});

describe('Hiện ảnh HEIC trong trình che khi trình duyệt không đọc được (D4)', () => {
  it('tệp không phải HEIC → null, không nạp WASM', async () => {
    await expect(heicToDisplayable({ name: 'a.jpg', type: 'image/jpeg' } as File)).resolves.toBeNull();
    expect(heic.loaded).toBe(false);
  });
  it('HEIC (type rỗng, đuôi .HEIC) → JPEG để hiển thị', async () => {
    const file = { name: 'IMG_1.HEIC', type: '' } as File;
    await expect(heicToDisplayable(file)).resolves.toBe(heic.jpeg);
    const { heicTo } = await import('heic-to');
    expect(heicTo).toHaveBeenCalledWith({ blob: file, type: 'image/jpeg', quality: 0.92 });
  });
});
