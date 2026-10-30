import { afterEach, describe, expect, it, vi } from 'vitest';
import { withTileTransition } from './withTileTransition';

const stub = (reduced: boolean, startViewTransition?: (update: () => void) => void) => {
  vi.stubGlobal('document', { startViewTransition });
  vi.stubGlobal('window', { matchMedia: () => ({ matches: reduced }) });
};

describe('withTileTransition', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('trình duyệt không hỗ trợ View Transition thì bỏ ảnh ngay', () => {
    stub(false);
    const update = vi.fn();
    withTileTransition(update);
    expect(update).toHaveBeenCalledOnce();
  });

  it('giảm chuyển động thì bỏ ảnh ngay, không chạy hiệu ứng', () => {
    const start = vi.fn();
    stub(true, start);
    const update = vi.fn();
    withTileTransition(update);
    expect(update).toHaveBeenCalledOnce();
    expect(start).not.toHaveBeenCalled();
  });

  it('có hỗ trợ thì bỏ ảnh bên trong hiệu ứng', () => {
    const start = vi.fn((run: () => void) => run());
    stub(false, start);
    const update = vi.fn();
    withTileTransition(update);
    expect(start).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledOnce();
  });
});
