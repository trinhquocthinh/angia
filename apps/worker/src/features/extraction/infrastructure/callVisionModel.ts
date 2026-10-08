import { z } from 'zod';

interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface VisionRequest {
  baseUrl: string;
  apiKey: string;
  model: string;
  prompt: string;
  image: { mimeType: string; base64: string };
  /** Gửi `reasoning: { enabled: false }` cho model bật suy luận mặc định (Kimi K2.6). */
  disableReasoning?: boolean;
}

export interface VisionResponse {
  content: string;
  usage: TokenUsage;
  /** Chi phí USD thực tế OpenRouter tính cho lời gọi (`usage.cost`). */
  costUsd: number;
  latencyMs: number;
}

const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string().nullable() }) })).min(1),
  usage: z.object({ prompt_tokens: z.number(), completion_tokens: z.number(), cost: z.number() }),
});

// Chỉ định tuyến tới nhà cung cấp không lưu trữ (ZDR) và không dùng dữ liệu để huấn luyện.
const PRIVACY_ROUTING = { data_collection: 'deny', zdr: true } as const;

/**
 * Gọi OpenRouter (chuẩn OpenAI chat completions). Body chỉ gồm ảnh và prompt schema —
 * không kèm định danh hồ sơ hay tên bệnh nhân (Tech Spec §6, ranh giới prompt).
 */
export const callVisionModel = async (
  request: VisionRequest,
  fetchFn: typeof fetch = fetch,
): Promise<VisionResponse> => {
  const startedAt = performance.now();
  const response = await fetchFn(`${request.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { authorization: `Bearer ${request.apiKey}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: request.model,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${request.image.mimeType};base64,${request.image.base64}` },
            },
            { type: 'text', text: request.prompt },
          ],
        },
      ],
      provider: PRIVACY_ROUTING,
      ...(request.disableReasoning ? { reasoning: { enabled: false } } : {}),
    }),
  });
  if (!response.ok) {
    // Không đọc nội dung lỗi nhà cung cấp: có thể chứa thông tin trong ảnh/prompt.
    await response.body?.cancel().catch(() => undefined);
    throw new Error(`HTTP ${response.status}`);
  }

  const completion = completionSchema.parse(await response.json());
  return {
    content: completion.choices[0]?.message.content ?? '',
    usage: {
      promptTokens: completion.usage.prompt_tokens,
      completionTokens: completion.usage.completion_tokens,
    },
    costUsd: completion.usage.cost,
    latencyMs: performance.now() - startedAt,
  };
};
