import { describe, expect, it, vi } from 'vitest';
import { createProviderBillingReader } from './createProviderBillingReader.js';
const source = {
  id: '01900000-0000-7000-8000-000000000001',
  provider: 'openrouter' as const,
  apiKey: 'synthetic',
};
const responses = (...values: unknown[]) =>
  vi.fn<typeof fetch>().mockImplementation(async () => Response.json(values.shift()));
describe('Đọc phí nhà cung cấp', () => {
  it('TC-541: OpenRouter dùng usage trọn đời và không tự tạo biên lai', async () => {
    const fetchFn = responses({ data: { usage: 0.5, usage_monthly: 0.1 } });
    expect(await createProviderBillingReader(fetchFn).read(source)).toEqual({ counter: '0.5', charges: [] });
    expect(fetchFn.mock.calls.map(([url]) => String(url))).toEqual(['https://openrouter.ai/api/v1/key']);
  });
  it('TC-541: lỗi upstream không lộ key hoặc body và cấm redirect', async () => {
    const fetchFn = vi.fn<typeof fetch>().mockResolvedValue(new Response('secret', { status: 401 }));
    await expect(createProviderBillingReader(fetchFn).read(source)).rejects.toThrow('billing_http_error');
    expect(fetchFn.mock.calls[0]?.[1]).toMatchObject({ redirect: 'error' });
  });
});

it('TC-541: lỗi mạng, JSON sai và body quá lớn chỉ trả mã lỗi cố định', async () => {
  await expect(
    createProviderBillingReader(async () => {
      throw new Error('synthetic-key');
    }).read(source),
  ).rejects.toThrow('billing_http_error');
  await expect(
    createProviderBillingReader(async () => new Response('{synthetic-key')).read(source),
  ).rejects.toThrow('billing_http_error');
  await expect(
    createProviderBillingReader(async () => new Response('x'.repeat(2_000_001))).read(source),
  ).rejects.toThrow('billing_http_error');
});
it('TC-541: không cộng usage_monthly thay usage', async () => {
  await expect(
    createProviderBillingReader(responses({ data: { usage_monthly: 0 } })).read(source),
  ).rejects.toThrow();
});
