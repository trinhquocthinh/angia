import type { DocumentExtractor } from '../application/ports.js';
import { callVisionModel } from './callVisionModel.js';
import { EXTRACTION_PROMPT } from './extractionPrompt.js';
import { parseModelJson } from './parseModelJson.js';

interface OpenRouterOptions {
  baseUrl: string;
  apiKey: string;
  model: string;
  timeoutMs?: number;
}

// Benchmark E1-S1-T1: Gemini 3.1 Flash-Lite ~5.7 s/ảnh; quá 60 s coi như lỗi mạng để pg-boss thử lại.
const DEFAULT_TIMEOUT_MS = 60_000;

/** Adapter `DocumentExtractor` chính (Tech Spec §1): một model, tắt suy luận, định tuyến ZDR. */
export function createOpenRouterExtractor(
  options: OpenRouterOptions,
  fetchFn: typeof fetch = fetch,
): DocumentExtractor {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const fetchWithTimeout: typeof fetch = (input, init) =>
    fetchFn(input, { ...init, signal: AbortSignal.timeout(timeoutMs) });
  return {
    extract: async (image) => {
      const response = await callVisionModel(
        {
          baseUrl: options.baseUrl,
          apiKey: options.apiKey,
          model: options.model,
          prompt: EXTRACTION_PROMPT,
          image: { mimeType: image.mimeType, base64: Buffer.from(image.bytes).toString('base64') },
          disableReasoning: true,
        },
        fetchWithTimeout,
      );
      const call = { provider: 'openrouter', model: options.model, costUsd: response.costUsd };
      const parsed = parseModelJson(response.content);
      return parsed.ok
        ? { ...call, ok: true, content: parsed.payload }
        : { ...call, ok: false, reason: parsed.reason };
    },
  };
}
