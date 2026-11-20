import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import { useHouseholdHomeAction } from './useHouseholdHomeAction';

function probe(context: 'ownership' | 'leave' | 'deletion', token: string) {
  let model!: ReturnType<typeof useHouseholdHomeAction>;
  function Probe() {
    model = useHouseholdHomeAction(context, token);
    return null;
  }
  renderToStaticMarkup(<Probe />);
  return model;
}
it.each(['ownership', 'leave', 'deletion'] as const)(
  'SPEC-067–069: %s chặn thiếu CSRF và mở khoá sau lỗi mạng',
  async (context) => {
    const task = vi.fn().mockRejectedValue(new Error('Thông tin nội bộ'));
    expect(await probe(context, '').run(task)).toEqual({ status: 'ignored' });
    expect(task).not.toHaveBeenCalled();
    const model = probe(context, 'csrf');
    expect(await model.run(task)).toEqual({
      status: 'error',
      code: 'NETWORK',
      message: 'Mất kết nối. Kiểm tra mạng rồi thử lại.',
    });
    expect(await model.run(async () => ({ ok: true, value: undefined }))).toEqual({ status: 'ok' });
  },
);
