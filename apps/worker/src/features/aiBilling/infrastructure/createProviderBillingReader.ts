import type { BillingReader } from '../application/ports.js';
import { readBillingJson } from './readBillingJson.js';
import { parseOpenRouterCounter } from './parseProviderBilling.js';
// CP5.6: chỉ OpenRouter; biên lai từng lời gọi đến từ observer lúc OCR, không đọc log nhà cung cấp.
export function createProviderBillingReader(fetchFn: typeof fetch = fetch): BillingReader {
  return {
    read: async (source) => ({
      counter: parseOpenRouterCounter(
        await readBillingJson('https://openrouter.ai/api/v1/key', source.apiKey, fetchFn),
      ),
      charges: [],
    }),
  };
}
