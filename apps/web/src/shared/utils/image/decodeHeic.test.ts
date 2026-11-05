import { describe, expect, it, vi } from 'vitest';
import { decodeHeic } from './decodeHeic';

const heic = vi.hoisted(() => ({ loaded: false, bitmap: { width: 4032, height: 3024 } as ImageBitmap }));
vi.mock('heic-to', () => {
  heic.loaded = true;
  return { heicTo: vi.fn(async () => heic.bitmap) };
});

describe('Giải mã HEIC qua WASM nạp động (E11-S3-T1)', () => {
  it('TC-428 chỉ nạp heic-to khi được gọi, trả ImageBitmap', async () => {
    expect(heic.loaded).toBe(false);
    const file = { name: 'IMG_0001.HEIC', type: 'image/heic' } as File;
    await expect(decodeHeic(file)).resolves.toBe(heic.bitmap);
    expect(heic.loaded).toBe(true);
    const { heicTo } = await import('heic-to');
    expect(heicTo).toHaveBeenCalledWith({ blob: file, type: 'bitmap' });
  });
});
