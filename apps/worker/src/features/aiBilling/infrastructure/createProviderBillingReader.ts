import type { BillingReader } from '../application/ports.js';
import { readBillingJson } from './readBillingJson.js';
import { parseOpenRouterCounter, parseWokuCharges, parseWokuCounter } from './parseProviderBilling.js';
export function createProviderBillingReader(fetchFn: typeof fetch = fetch): BillingReader {
  return {
    read: async (source) => {
      const read = (url: string) => readBillingJson(url, source.apiKey, fetchFn);
      if (source.provider === 'openrouter')
        return {
          counter: parseOpenRouterCounter(await read('https://openrouter.ai/api/v1/key')),
          charges: [],
        };
      const url = 'https://llm.wokushop.com';
      const before = parseWokuCounter(await read(`${url}/api/usage/token/`));
      const charges = parseWokuCharges(
        await read(`${url}/api/log/token?key=${encodeURIComponent(source.apiKey)}`),
      );
      const after = parseWokuCounter(await read(`${url}/api/usage/token/`));
      if (before !== after) throw new Error('billing_unstable_counter');
      return { counter: after, charges };
    },
  };
}
