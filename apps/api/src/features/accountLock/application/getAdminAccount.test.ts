import { describe, expect, it, vi } from 'vitest';
import { getAdminAccount } from './getAdminAccount.js';
const view = { id: 'target', username: null, displayName: 'Người thử', familyName: null, lockedAt: null };
const fake = () => ({ get: vi.fn(), lock: vi.fn(), unlock: vi.fn() });
describe('getAdminAccount', () => {
  it('TC-837: tài khoản không tồn tại trả ERR_NOT_FOUND', async () => {
    const repository = fake();
    repository.get.mockResolvedValue(null);
    expect(await getAdminAccount(repository, 'target')).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
  });
  it('TC-837: thành công trả đúng view', async () => {
    const repository = fake();
    repository.get.mockResolvedValue(view);
    expect(await getAdminAccount(repository, 'target')).toEqual({ ok: true, value: view });
    expect(repository.get).toHaveBeenCalledExactlyOnceWith('target');
  });
});
