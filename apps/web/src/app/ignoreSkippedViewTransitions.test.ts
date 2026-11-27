import { describe, expect, it, vi } from 'vitest';
import { ignoreSkippedViewTransitions } from './ignoreSkippedViewTransitions';

function fakeDocument() {
  const ready = Promise.reject(new DOMException('Transition was skipped', 'AbortError'));
  const transition = { ready, finished: Promise.resolve(), updateCallbackDone: Promise.resolve() };
  const start = vi.fn(() => transition);
  return { doc: { startViewTransition: start } as unknown as Document, start, transition };
}

describe('ignoreSkippedViewTransitions', () => {
  it('bắt lỗi ready khi chuyển cảnh bị bỏ qua, vẫn trả đúng transition cho router', async () => {
    const { doc, start, transition } = fakeDocument();
    const unhandled = vi.fn();
    process.on('unhandledRejection', unhandled);

    ignoreSkippedViewTransitions(doc);
    const update = () => undefined;
    const result = doc.startViewTransition(update);
    await new Promise((resolve) => setTimeout(resolve, 0));
    process.off('unhandledRejection', unhandled);

    expect(start).toHaveBeenCalledWith(update);
    expect(result).toBe(transition);
    expect(unhandled).not.toHaveBeenCalled();
  });

  it('không làm gì khi trình duyệt không hỗ trợ View Transitions', () => {
    const doc = {} as Document;
    ignoreSkippedViewTransitions(doc);
    expect(doc.startViewTransition).toBeUndefined();
  });
});
