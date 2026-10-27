import { describe, expect, it, vi } from 'vitest';
import { createProviderBillingReader } from './createProviderBillingReader.js';
const source = { id: '01900000-0000-7000-8000-000000000001', provider: 'woku' as const, apiKey: 'synthetic' };
const meter = (quota: number) => ({ code: true, data: { total_used: quota } });
const row = { id: 9, type: 2, created_at: 1780000000, quota: 20, other: '{"billing_quota_per_unit":100}' };
const responses = (...values: unknown[]) =>
  vi.fn<typeof fetch>().mockImplementation(async () => Response.json(values.shift()));
describe('Đọc phí nhà cung cấp', () => {
  it('TC-541: Woku chỉ nhận log tiêu thụ và xác minh đồng hồ trước/sau', async () => {
    const fetchFn = responses(meter(20), { success: true, data: [row, row, { type: 1 }] }, meter(20));
    expect(await createProviderBillingReader(fetchFn).read(source)).toEqual({
      counter: '20',
      charges: [
        { externalId: '9', chargedAt: new Date(1780000000000), counterAmount: '20', unitDivisor: '100' },
      ],
    });
    expect(fetchFn.mock.calls.map(([url]) => String(url))).toEqual([
      'https://llm.wokushop.com/api/usage/token/',
      'https://llm.wokushop.com/api/log/token?key=synthetic',
      'https://llm.wokushop.com/api/usage/token/',
    ]);
  });
  it('TC-541: từ chối đồng hồ đổi trong lúc đọc và log xung đột', async () => {
    await expect(
      createProviderBillingReader(responses(meter(20), { success: true, data: [row] }, meter(21))).read(
        source,
      ),
    ).rejects.toThrow('billing_unstable_counter');
    await expect(
      createProviderBillingReader(
        responses(meter(20), { success: true, data: [row, { ...row, quota: 21 }] }, meter(20)),
      ).read(source),
    ).rejects.toThrow('receipt_conflict');
  });
  it('TC-541: OpenRouter dùng usage trọn đời và không tự tạo biên lai', async () => {
    expect(
      await createProviderBillingReader(responses({ data: { usage: 0.5, usage_monthly: 0.1 } })).read({
        ...source,
        provider: 'openrouter',
      }),
    ).toEqual({ counter: '0.5', charges: [] });
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
it('TC-541: từ chối quota âm, divisor thiếu và không cộng usage_monthly thay usage', async () => {
  await expect(createProviderBillingReader(responses(meter(-1))).read(source)).rejects.toThrow();
  await expect(
    createProviderBillingReader(
      responses(meter(20), { success: true, data: [{ ...row, other: '{}' }] }),
    ).read(source),
  ).rejects.toThrow();
  await expect(
    createProviderBillingReader(responses({ data: { usage_monthly: 0 } })).read({
      ...source,
      provider: 'openrouter',
    }),
  ).rejects.toThrow();
});
