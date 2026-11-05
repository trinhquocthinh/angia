import { expect, it } from 'vitest';
import { parseBillingSources } from './parseBillingSources.js';
const a = { id: '01900000-0000-7000-8000-000000000001', provider: 'openrouter', apiKey: 'synthetic' };
it('TC-544: cấu hình mặc định rỗng, từ chối ID/key trùng và không đưa key vào lỗi', () => {
  expect(parseBillingSources('[]')).toEqual([]);
  expect(parseBillingSources(JSON.stringify([a]))).toEqual([a]);
  expect(() => parseBillingSources(JSON.stringify([a, a]))).toThrow('billing_sources_invalid');
  expect(() =>
    parseBillingSources(JSON.stringify([a, { ...a, id: '01900000-0000-7000-8000-000000000002' }])),
  ).toThrow('billing_sources_invalid');
  expect(() => parseBillingSources('synthetic')).toThrow('billing_sources_invalid');
});
it('TC-650: nguồn Woku bị từ chối sau CP5.6', () => {
  expect(() => parseBillingSources(JSON.stringify([{ ...a, provider: 'woku' }]))).toThrow(
    'billing_sources_invalid',
  );
});
