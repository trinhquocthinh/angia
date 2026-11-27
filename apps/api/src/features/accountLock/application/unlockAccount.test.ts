import { describe, expect, it, vi } from 'vitest';
import { unlockAccount } from './unlockAccount.js';
const view = { id: 'target', username: null, displayName: 'Người thử', familyName: null, lockedAt: null };
const fake = () => ({ get: vi.fn(), lock: vi.fn(), unlock: vi.fn() });
describe('unlockAccount', () => {
  it('TC-836: tài khoản không tồn tại trả ERR_NOT_FOUND', async () => {
    const repository = fake();
    repository.unlock.mockResolvedValue(null);
    expect(await unlockAccount(repository, 'actor', 'target')).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
  });
  it('TC-836: thành công trả đúng view', async () => {
    const repository = fake();
    repository.unlock.mockResolvedValue(view);
    expect(await unlockAccount(repository, 'actor', 'target')).toEqual({ ok: true, value: view });
    expect(repository.unlock).toHaveBeenCalledExactlyOnceWith('actor', 'target');
  });
});
