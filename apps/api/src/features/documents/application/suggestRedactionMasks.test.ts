import { describe, expect, it, vi } from 'vitest';
import type { OcrMaskBox } from './redactionSuggestionPorts.js';
import { suggestRedactionMasks } from './suggestRedactionMasks.js';

const jpeg = new Uint8Array([0xff, 0xd8, 0xff]);
const signal = new AbortController().signal;
const logger = () => ({ info: vi.fn() });

describe('Gợi ý vùng che từ ocr-mask (SPEC-083)', () => {
  it('đổi bbox sang khung, gộp, cắt còn 64 và chỉ ghi log số khung', async () => {
    // 70 khung rời nhau theo cột dọc → không gộp được → cắt còn 64 khung đầu theo top.
    const boxes: OcrMaskBox[] = Array.from({ length: 70 }, (_, i) => [
      0.1,
      i * 0.014,
      0.2,
      i * 0.014 + 0.004,
    ]);
    const log = logger();
    const result = await suggestRedactionMasks(
      { analyzer: { analyze: async () => boxes }, logger: log },
      jpeg,
      signal,
    );
    if (!result.ok) throw new Error(result.code);
    expect(result.masks).toHaveLength(64);
    expect(result.masks[0]).toEqual({ left: 96_000, top: 0, width: 108_000, height: 8_000 });
    expect(log.info).toHaveBeenCalledWith(
      expect.objectContaining({ boxes: 70, masks: 64 }),
      expect.any(String),
    );
  });

  it('TC-888: chưa cấu hình analyzer hoặc analyzer ném lỗi → ERR_SUGGESTION_UNAVAILABLE', async () => {
    const failing = { analyze: vi.fn().mockRejectedValue(new Error('NGUYEN VAN A')) };
    expect(await suggestRedactionMasks(undefined, jpeg, signal)).toEqual({
      ok: false,
      code: 'ERR_SUGGESTION_UNAVAILABLE',
    });
    const log = logger();
    expect(await suggestRedactionMasks({ analyzer: failing, logger: log }, jpeg, signal)).toEqual({
      ok: false,
      code: 'ERR_SUGGESTION_UNAVAILABLE',
    });
    expect(failing.analyze).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(log.info.mock.calls)).not.toContain('NGUYEN VAN A');
  });
});
