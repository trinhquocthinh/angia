import { describe, expect, it, vi } from 'vitest';
import { RedactionSuggestionError } from './redactionSuggestionPorts';
import { requestRedactionSuggestions } from './requestRedactionSuggestions';

const rect = (left: number) => ({ left, top: 0, width: 10, height: 10 });
const input = (overrides: Partial<Parameters<typeof requestRedactionSuggestions>[0]> = {}) => ({
  exportImage: vi.fn(async () => new Blob(['jpeg'])),
  suggest: vi.fn(async () => [rect(1), rect(2), rect(3)]),
  signal: new AbortController().signal,
  room: () => 32,
  add: vi.fn(),
  ...overrides,
});

describe('Gợi ý vùng che trong trình che (SPEC-083)', () => {
  it('thêm khung vào bản che và báo số khung đã thêm / bị bỏ vì đủ 32 vùng', async () => {
    const run = input({ room: () => 2 });
    expect(await requestRedactionSuggestions(run)).toEqual({ kind: 'done', added: 2, dropped: 1 });
    expect(run.add).toHaveBeenCalledWith([rect(1), rect(2), rect(3)]);
    const empty = input({ suggest: vi.fn(async () => []) });
    expect(await requestRedactionSuggestions(empty)).toEqual({ kind: 'done', added: 0, dropped: 0 });
    expect(empty.add).not.toHaveBeenCalled();
  });

  it('TC-893: bận hoặc lỗi → trạng thái lỗi, không thêm khung, không tự gửi lại', async () => {
    for (const [error, reason] of [
      [new RedactionSuggestionError('busy'), 'busy'],
      [new RedactionSuggestionError('unavailable'), 'unavailable'],
      [new TypeError('Failed to fetch'), 'unavailable'],
    ] as const) {
      const run = input({ suggest: vi.fn().mockRejectedValue(error) });
      expect(await requestRedactionSuggestions(run)).toEqual({ kind: 'error', reason });
      expect(run.suggest).toHaveBeenCalledTimes(1);
      expect(run.add).not.toHaveBeenCalled();
    }
    const unreadable = input({ exportImage: vi.fn().mockRejectedValue(new Error('decode')) });
    expect(await requestRedactionSuggestions(unreadable)).toEqual({ kind: 'error', reason: 'unavailable' });
    expect(unreadable.suggest).not.toHaveBeenCalled();
  });

  it('TC-893: bị huỷ (bấm Huỷ, rời trình che) → không thêm khung, không báo gì', async () => {
    const controller = new AbortController();
    const run = input({
      signal: controller.signal,
      suggest: vi.fn(async () => {
        controller.abort();
        return [rect(1)];
      }),
    });
    expect(await requestRedactionSuggestions(run)).toBeNull();
    expect(run.add).not.toHaveBeenCalled();
  });
});
