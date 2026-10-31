import { afterEach, describe, expect, it, vi } from 'vitest';
import { withRowTransition } from './withRowTransition';

const stub = (reduced: boolean, startViewTransition?: (update: () => void) => void) => {
  vi.stubGlobal('document', { startViewTransition });
  vi.stubGlobal('window', { matchMedia: () => ({ matches: reduced }) });
};

describe('withRowTransition', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('trình duyệt không hỗ trợ View Transition thì xóa dòng ngay', () => {
    stub(false);
    const update = vi.fn();
    withRowTransition(update);
    expect(update).toHaveBeenCalledOnce();
  });

  it('giảm chuyển động thì xóa dòng ngay, không chạy hiệu ứng', () => {
    const start = vi.fn();
    stub(true, start);
    const update = vi.fn();
    withRowTransition(update);
    expect(update).toHaveBeenCalledOnce();
    expect(start).not.toHaveBeenCalled();
  });

  it('có hỗ trợ thì xóa dòng bên trong hiệu ứng', () => {
    const start = vi.fn((run: () => void) => run());
    stub(false, start);
    const update = vi.fn();
    withRowTransition(update);
    expect(start).toHaveBeenCalledOnce();
    expect(update).toHaveBeenCalledOnce();
  });
});
