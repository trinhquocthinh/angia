import { describe, expect, it, vi } from 'vitest';
import type { DocumentExtractor, ExtractorResult } from '../application/ports.js';
import { createFallbackExtractor } from './createFallbackExtractor.js';

const image = { bytes: new Uint8Array([0xff, 0xd8, 0xff]), mimeType: 'image/jpeg' };
const content = {
  type: 'prescription',
  issuedDate: null,
  facility: null,
  diagnosis: null,
  items: [],
} as const;
const answer = (model: string, costUsd: number): ExtractorResult => ({
  ok: true,
  content,
  provider: 'openrouter',
  model,
  costUsd,
});
const extractor = (run: DocumentExtractor['extract']) => ({ extract: vi.fn(run) });

describe('Đổi sang model dự phòng (SPEC-009, E3-S6-T2)', () => {
  it('model chính trả lời → dùng kết quả chính, không gọi dự phòng', async () => {
    const primary = extractor(async () => answer('google/gemini-3.1-flash-lite', 0.001));
    const fallback = extractor(async () => answer('moonshotai/kimi-k2.6', 0.0035));
    expect(await createFallbackExtractor(primary, fallback).extract(image)).toMatchObject({
      model: 'google/gemini-3.1-flash-lite',
    });
    expect(fallback.extract).not.toHaveBeenCalled();
  });

  it('TC-086: model chính lỗi HTTP 500 → gọi dự phòng cùng ảnh, trả kết quả dự phòng', async () => {
    const primary = extractor(async () => {
      throw new Error('HTTP 500');
    });
    const fallback = extractor(async () => answer('moonshotai/kimi-k2.6', 0.0035));
    expect(await createFallbackExtractor(primary, fallback).extract(image)).toEqual(
      answer('moonshotai/kimi-k2.6', 0.0035),
    );
    expect(fallback.extract).toHaveBeenCalledWith(image);
  });

  it('model chính trả sai định dạng → giữ kết quả chính (manual_entry), không tốn thêm lời gọi dự phòng', async () => {
    const primary = extractor(async () => ({
      ok: false,
      reason: 'invalid_json',
      provider: 'openrouter',
      model: 'google/gemini-3.1-flash-lite',
      costUsd: 0.001,
    }));
    const fallback = extractor(async () => answer('moonshotai/kimi-k2.6', 0.0035));
    expect(await createFallbackExtractor(primary, fallback).extract(image)).toMatchObject({
      ok: false,
      reason: 'invalid_json',
    });
    expect(fallback.extract).not.toHaveBeenCalled();
  });

  it('TC-087: cả hai model lỗi mạng → ném lỗi của dự phòng để pg-boss thử lại/hết lượt thì nhập tay', async () => {
    const primary = extractor(async () => {
      throw new Error('fetch failed');
    });
    const fallback = extractor(async () => {
      throw new Error('HTTP 503');
    });
    await expect(createFallbackExtractor(primary, fallback).extract(image)).rejects.toThrow('HTTP 503');
  });
});
