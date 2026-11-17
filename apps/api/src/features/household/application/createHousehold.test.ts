import { describe, expect, it, vi } from 'vitest';
import { createHousehold } from './createHousehold.js';

describe('Tạo nhà tự phục vụ', () => {
  it('TC-767: chuyển tài khoản và DTO tới port transaction', async () => {
    const result = { ok: true as const, family: { id: 'nhà', name: 'Nhà Lan', createdAt: new Date() } };
    const repository = { create: vi.fn().mockResolvedValue(result) };
    expect(await createHousehold(repository, 'tài khoản', { name: 'Nhà Lan' })).toBe(result);
    expect(repository.create).toHaveBeenCalledWith('tài khoản', { name: 'Nhà Lan' });
  });
  it('TC-768: giữ nguyên lỗi nghiệp vụ từ transaction', async () => {
    const result = { ok: false as const, code: 'ERR_ACCOUNT_ALREADY_IN_FAMILY' as const };
    expect(await createHousehold({ create: async () => result }, 'tài khoản', { name: 'Nhà' })).toEqual(
      result,
    );
  });
});
