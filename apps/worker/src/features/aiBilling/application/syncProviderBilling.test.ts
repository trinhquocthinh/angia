import { expect, it, vi } from 'vitest';
import { syncProviderBilling } from './syncProviderBilling.js';
import type { BillingRepository } from './ports.js';
const source = { id: 'a', provider: 'openrouter' as const, apiKey: 'synthetic' };
const lease = { sourceId: 'a', token: 't', lastCounter: null };
const repository = (): BillingRepository => ({
  register: vi.fn(),
  claim: vi.fn().mockResolvedValue(lease),
  finish: vi.fn(),
  fail: vi.fn(),
  observe: vi.fn(),
});
it('TC-542: đăng ký cả cấu hình rỗng để đánh dấu nguồn thiếu credential', async () => {
  const repo = repository();
  await syncProviderBilling([], repo, { read: vi.fn() });
  expect(repo.register).toHaveBeenCalledWith([]);
});
it('TC-542: lease bận không gọi nhà cung cấp; lỗi được phân loại và tiếp tục nguồn khác', async () => {
  const repo = repository();
  vi.mocked(repo.claim).mockResolvedValueOnce(null).mockResolvedValueOnce(lease);
  const read = vi.fn().mockRejectedValue(new Error('receipt_conflict'));
  await syncProviderBilling([source, source], repo, { read });
  expect(read).toHaveBeenCalledTimes(1);
  expect(repo.fail).toHaveBeenCalledWith(lease, 'receipt_conflict');
});
it('TC-542: lưu snapshot bằng lease, không dùng thời gian từ tiến trình', async () => {
  const repo = repository();
  const snapshot = { counter: '0', charges: [] };
  await syncProviderBilling([source], repo, { read: async () => snapshot });
  expect(repo.finish).toHaveBeenCalledWith(lease, snapshot);
});
