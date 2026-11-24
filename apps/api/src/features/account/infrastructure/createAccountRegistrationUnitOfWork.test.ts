import { describe, expect, it, vi } from 'vitest';
import type { Database } from '@src/shared/db/createDatabase.js';
import { createAccountRegistrationUnitOfWork } from './createAccountRegistrationUnitOfWork.js';

vi.mock('./checkRegistrationInvitation.js', () => ({
  checkRegistrationInvitation: () => Promise.resolve(null),
}));

describe('Giữ tên đăng nhập đã xoá (SPEC-073)', () => {
  it('TC-827: kiểm tra tên bị giữ trong transaction trước khi ghi tài khoản', async () => {
    const select = vi.fn(() => ({
      from: () => ({ where: () => ({ limit: () => Promise.resolve([{ usernameHash: 'hash' }]) }) }),
    }));
    const insert = vi.fn(() => {
      throw new Error('Không được ghi tên đang bị giữ');
    });
    const tx = { select, insert };
    const db = { transaction: (work: (executor: typeof tx) => Promise<unknown>) => work(tx) };
    const hashUsername = vi.fn(() => 'hash');
    const uow = createAccountRegistrationUnitOfWork(db as unknown as Database, hashUsername);
    expect(
      await uow.register({
        usernameNormalized: 'me.lan',
        passwordHash: 'password-hash',
        displayName: 'Mẹ Lan',
        legalAcceptance: { termsVersionId: 'terms', privacyVersionId: 'privacy' },
      }),
    ).toEqual({ ok: false, code: 'ERR_USERNAME_TAKEN' });
    expect(hashUsername).toHaveBeenCalledWith('me.lan');
    expect(insert).not.toHaveBeenCalled();
  });
  it('TC-827: tên bị giữ sau khi INSERT chờ giao dịch xoá phải rollback đăng ký', async () => {
    let inserted = false;
    const select = () => ({
      from: () => ({
        where: () => ({
          limit: () => Promise.resolve(inserted ? [{ usernameHash: 'hash' }] : []),
        }),
      }),
    });
    const account = {
      id: 'account',
      usernameNormalized: 'me.lan',
      displayName: 'Mẹ Lan',
      legalRef: 'legal-ref',
    };
    const insert = () => ({
      values: () => {
        inserted = true;
        return { returning: () => Promise.resolve([{ ...account, version: 1 }]) };
      },
    });
    const tx = { select, insert };
    const db = { transaction: (work: (executor: typeof tx) => Promise<unknown>) => work(tx) };
    const uow = createAccountRegistrationUnitOfWork(db as unknown as Database, () => 'hash');
    expect(
      await uow.register({
        usernameNormalized: 'me.lan',
        passwordHash: 'password-hash',
        displayName: 'Mẹ Lan',
        legalAcceptance: { termsVersionId: 'terms', privacyVersionId: 'privacy' },
      }),
    ).toEqual({ ok: false, code: 'ERR_USERNAME_TAKEN' });
  });
});
