import { expect, it, vi } from 'vitest';
import type pg from 'pg';
import { createBillingRepository } from './createBillingRepository.js';
it('TC-543: lỗi đăng ký chỉ trả mã cố định, không lộ chi tiết credential PostgreSQL', async () => {
  const client = {
    query: vi
      .fn()
      .mockResolvedValue({})
      .mockRejectedValueOnce(new Error('credential_fingerprint=synthetic-secret')),
    release: vi.fn(),
  };
  const pool = { connect: async () => client } as unknown as pg.Pool;
  await expect(createBillingRepository(pool).register([])).rejects.toThrow(/^billing_registration_failed$/);
});
