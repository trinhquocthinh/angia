import { describe, expect, it, vi } from 'vitest';
import type { PgBoss } from 'pg-boss';
import type { QuotaTx } from './quotaTypes.js';
import { requestScanQuotaRequeue } from './requestScanQuotaRequeue.js';
describe('Đánh thức chứng từ khi cấp lượt', () => {
  it('TC-617: gửi đúng gia đình trong cùng transaction và lỗi queue phải rollback phía gọi', async () => {
    const tx = { execute: vi.fn() } as unknown as QuotaTx;
    const send = vi.fn().mockResolvedValue('job');
    const boss = { send } as unknown as PgBoss;
    await requestScanQuotaRequeue(tx, boss, ['family-a', 'family-b']);
    expect(send).toHaveBeenCalledWith(
      'requeue-awaiting-budget',
      { familyId: 'family-a' },
      { db: expect.objectContaining({ executeSql: expect.any(Function) }) },
    );
    expect(send).toHaveBeenCalledTimes(2);
    send.mockResolvedValue(null);
    await expect(requestScanQuotaRequeue(tx, boss, ['family-a'])).rejects.toThrow();
  });
});
