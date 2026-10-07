import { describe, expect, it, vi } from 'vitest';
import { createOpenRouterExtractor } from './createOpenRouterExtractor.js';

const options = {
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKey: 'sk-or-test',
  model: 'google/gemini-3.1-flash-lite',
};
const prescription = { type: 'prescription', issuedDate: null, facility: null, items: [] };
const reply = (content: string) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content } }],
      usage: { prompt_tokens: 1200, completion_tokens: 80, cost: 0.0011 },
    }),
    { status: 200 },
  );
const image = { bytes: new Uint8Array([0xff, 0xd8, 0xff]), mimeType: 'image/jpeg' };

describe('Adapter OpenRouter cho DocumentExtractor (SPEC-009)', () => {
  it('payload đúng schema → ok kèm provider, model và chi phí thực từ usage.cost', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(reply(JSON.stringify(prescription)));
    expect(await createOpenRouterExtractor(options, fetchFn).extract(image)).toEqual({
      ok: true,
      content: prescription,
      provider: 'openrouter',
      model: 'google/gemini-3.1-flash-lite',
      costUsd: 0.0011,
    });
  });

  it('TC-079: body chỉ gồm ảnh base64 + prompt, tắt suy luận, ZDR; có timeout', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(reply(JSON.stringify(prescription)));
    await createOpenRouterExtractor(options, fetchFn).extract(image);
    const [, init] = fetchFn.mock.calls[0] ?? [];
    const body = JSON.parse(String(init?.body));
    expect(body.messages[0].content[0].image_url.url).toBe('data:image/jpeg;base64,/9j/');
    expect(body).toMatchObject({
      reasoning: { enabled: false },
      provider: { data_collection: 'deny', zdr: true },
    });
    expect(Object.keys(body).sort()).toEqual(['messages', 'model', 'provider', 'reasoning']);
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it('phản hồi không phải JSON hoặc sai schema → ok:false, vẫn ghi nhận chi phí', async () => {
    const extractor = createOpenRouterExtractor(options, async () => reply('Ảnh mờ, không đọc được'));
    expect(await extractor.extract(image)).toMatchObject({
      ok: false,
      reason: 'invalid_json',
      costUsd: 0.0011,
    });
    const mismatch = createOpenRouterExtractor(options, async () => reply('{"type":"invoice"}'));
    expect(await mismatch.extract(image)).toMatchObject({ ok: false, reason: 'schema_mismatch' });
  });

  it('HTTP lỗi → ném exception để pg-boss thử lại', async () => {
    const extractor = createOpenRouterExtractor(
      options,
      async () => new Response('upstream', { status: 503 }),
    );
    await expect(extractor.extract(image)).rejects.toThrow('HTTP 503');
  });
});
