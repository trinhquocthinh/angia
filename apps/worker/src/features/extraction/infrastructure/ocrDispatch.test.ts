import { describe, expect, it, vi } from 'vitest';
import { OcrGateBlockedError } from '../application/OcrGateBlockedError.js';
import { callVisionModel } from './callVisionModel.js';
import { createFallbackExtractor } from './createFallbackExtractor.js';
import { createFakeExtractor } from './createFakeExtractor.js';
import { createOpenRouterExtractor } from './createOpenRouterExtractor.js';

const image = { bytes: new Uint8Array([1]), mimeType: 'image/jpeg' };
const request = {
  baseUrl: 'https://example.test',
  apiKey: 'test',
  model: 'test',
  prompt: 'JSON',
  image: { mimeType: 'image/jpeg', base64: 'AQ==' },
};
const answer = () =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: '{}' } }],
      usage: { prompt_tokens: 1, completion_tokens: 1, cost: 0 },
    }),
  );

describe('Đếm lượt tại biên HTTP', () => {
  it('TC-598: dựng body trước cổng, hoàn tất cổng ngay trước fetch', async () => {
    const events: string[] = [];
    const beforeDispatch = async () => {
      events.push('gate');
      request.image.base64 = 'changed';
    };
    const fetchFn = vi.fn<typeof fetch>(async (_url, init) => {
      events.push('fetch');
      expect(String(init?.body)).toContain('AQ==');
      return answer();
    });
    await callVisionModel({ ...request, beforeDispatch }, fetchFn);
    expect(events).toEqual(['gate', 'fetch']);
    request.image.base64 = 'AQ==';
  });

  it('TC-599: cổng từ chối thì không gửi HTTP', async () => {
    const fetchFn = vi.fn<typeof fetch>();
    const beforeDispatch = async () => {
      throw new OcrGateBlockedError('budget_exhausted');
    };
    await expect(callVisionModel({ ...request, beforeDispatch }, fetchFn)).rejects.toThrow(
      OcrGateBlockedError,
    );
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('TC-600: adapter truyền cùng callback cho cả hai lần gửi', async () => {
    const hook = vi.fn(async () => undefined);
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new Error('HTTP 500'))
      .mockResolvedValueOnce(answer());
    const adapter = () =>
      createOpenRouterExtractor({ baseUrl: request.baseUrl, apiKey: 'test', model: 'test' }, fetchFn);
    await createFallbackExtractor(adapter(), adapter()).extract(image, hook);
    expect(hook).toHaveBeenCalledTimes(2);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('TC-601: lỗi cổng không kích hoạt model dự phòng', async () => {
    const primary = {
      extract: vi.fn(async () => {
        throw new OcrGateBlockedError('billing_unavailable');
      }),
    };
    const fallback = { extract: vi.fn() };
    await expect(createFallbackExtractor(primary, fallback).extract(image)).rejects.toThrow(
      OcrGateBlockedError,
    );
    expect(fallback.extract).not.toHaveBeenCalled();
  });

  it('TC-602: fake gọi cổng đúng một lần và không ghi phí nhà cung cấp', async () => {
    const hook = vi.fn(async () => undefined);
    expect(await createFakeExtractor().extract(image, hook)).toMatchObject({ provider: 'fake', costUsd: 0 });
    expect(hook).toHaveBeenCalledTimes(1);
  });
});
