import { describe, expect, it, vi } from 'vitest';
import { callVisionModel } from './callVisionModel.js';

const request = {
  baseUrl: 'https://openrouter.ai/api/v1/',
  apiKey: 'sk-or-test',
  model: 'qwen/qwen3-vl-32b-instruct',
  prompt: 'Trích xuất JSON',
  image: { mimeType: 'image/jpeg', base64: 'AAAA' },
};

const okResponse = (
  usage: Record<string, number> = { prompt_tokens: 1200, completion_tokens: 300, cost: 0.00025 },
) =>
  new Response(JSON.stringify({ choices: [{ message: { content: '{"type":"prescription"}' } }], usage }), {
    status: 200,
  });

describe('callVisionModel', () => {
  it('gửi ảnh dạng data URI kèm prompt tới /chat/completions với Bearer key', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(okResponse());
    await callVisionModel(request, fetchFn);

    const [url, init] = fetchFn.mock.calls[0] ?? [];
    expect(url).toBe('https://openrouter.ai/api/v1/chat/completions');
    expect(new Headers(init?.headers).get('authorization')).toBe('Bearer sk-or-test');
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: 'qwen/qwen3-vl-32b-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: 'data:image/jpeg;base64,AAAA' } },
            { type: 'text', text: 'Trích xuất JSON' },
          ],
        },
      ],
    });
  });

  it('yêu cầu OpenRouter chỉ định tuyến tới nhà cung cấp không lưu, không thu thập dữ liệu', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(okResponse());
    await callVisionModel(request, fetchFn);

    const body = JSON.parse(String(fetchFn.mock.calls[0]?.[1]?.body));
    expect(body.provider).toEqual({ data_collection: 'deny', zdr: true });
  });

  it('tắt suy luận khi được yêu cầu, giảm chi phí và độ trễ', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(okResponse());
    await callVisionModel({ ...request, disableReasoning: true }, fetchFn);

    const body = JSON.parse(String(fetchFn.mock.calls[0]?.[1]?.body));
    expect(body.reasoning).toEqual({ enabled: false });
  });

  it('giữ mặc định suy luận của model khi không yêu cầu tắt', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(okResponse());
    await callVisionModel(request, fetchFn);

    const body = JSON.parse(String(fetchFn.mock.calls[0]?.[1]?.body));
    expect(body).not.toHaveProperty('reasoning');
  });

  it('trả nội dung, số token và chi phí USD thực tế do OpenRouter báo', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(okResponse());
    const result = await callVisionModel(request, fetchFn);
    expect(result).toMatchObject({
      content: '{"type":"prescription"}',
      usage: { promptTokens: 1200, completionTokens: 300 },
      costUsd: 0.00025,
    });
  });

  it('ném lỗi khi phản hồi không có chi phí, tránh ghi số liệu chi phí sai', async () => {
    const fetchFn = vi
      .fn<typeof fetch>()
      .mockResolvedValue(okResponse({ prompt_tokens: 1, completion_tokens: 1 }));
    await expect(callVisionModel(request, fetchFn)).rejects.toThrow();
  });

  it('ném lỗi kèm mã HTTP khi dịch vụ trả lỗi', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(new Response('quota', { status: 429 }));
    await expect(callVisionModel(request, fetchFn)).rejects.toThrow('HTTP 429');
  });
});
