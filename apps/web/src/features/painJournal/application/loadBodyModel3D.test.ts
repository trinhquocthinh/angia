import { describe, expect, it, vi } from 'vitest';
import { loadBodyModel3D } from './loadBodyModel3D';

describe('loadBodyModel3D', () => {
  it('TC-730: thiết bị không có WebGL thì không nạp chunk 3D', async () => {
    const load = vi.fn();
    await expect(loadBodyModel3D(() => false, load)).resolves.toBeNull();
    expect(load).not.toHaveBeenCalled();
  });

  it('TC-730: chunk 3D hoặc mô hình nạp lỗi thì trả null để quay về 2D', async () => {
    await expect(
      loadBodyModel3D(
        () => true,
        () => Promise.reject(new Error('chunk')),
      ),
    ).resolves.toBeNull();
  });

  it('trả mô hình khi nạp được', async () => {
    await expect(
      loadBodyModel3D(
        () => true,
        () => Promise.resolve('model'),
      ),
    ).resolves.toBe('model');
  });
});
