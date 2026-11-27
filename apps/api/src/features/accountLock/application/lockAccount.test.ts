import { describe, expect, it, vi } from 'vitest';
import { lockAccount } from './lockAccount.js';
const view = { id: 'target', username: null, displayName: 'Người thử', familyName: null, lockedAt: null };
const fake = () => ({ get: vi.fn(), lock: vi.fn(), unlock: vi.fn() });
describe('lockAccount', () => {
  it('TC-835: tài khoản không tồn tại trả ERR_NOT_FOUND', async () => {
    const repository = fake();
    repository.lock.mockResolvedValue(null);
    expect(await lockAccount(repository, 'actor', 'target', 'Lý do')).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });
  it('TC-835: thành công trả đúng view', async () => {
    const repository = fake();
    repository.lock.mockResolvedValue(view);
    expect(await lockAccount(repository, 'actor', 'target', 'Lý do')).toEqual({ ok: true, value: view });
    expect(repository.lock).toHaveBeenCalledExactlyOnceWith('actor', 'target', 'Lý do');
  });
  it('TC-837: không cho tự khoá, không gọi repository', async () => {
    const repository = fake();
    expect(await lockAccount(repository, 'actor', 'actor', 'Lý do')).toEqual({
      ok: false,
      code: 'ERR_FORBIDDEN',
    });
    expect(repository.lock).not.toHaveBeenCalled();
  });
  it('TC-837: tự khoá với UUID viết hoa vẫn bị chặn trước repository', async () => {
    const repository = fake();
    const id = 'ab476456-4d26-4efe-a751-5abb4b413975';
    expect(await lockAccount(repository, id, id.toUpperCase(), 'Lý do')).toEqual({
      ok: false,
      code: 'ERR_FORBIDDEN',
    });
    expect(repository.lock).not.toHaveBeenCalled();
  });
});
