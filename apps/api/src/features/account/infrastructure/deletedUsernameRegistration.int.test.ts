import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { createSessionRepository } from '@src/shared/auth/infrastructure/createSessionRepository.js';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { createUsernameHasher } from './createUsernameHasher.js';

describe('Giữ tên đăng nhập đã xoá trong PostgreSQL thật (SPEC-073)', () => {
  let fixture: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  const hashUsername = createUsernameHasher('test-username-secret'.repeat(3));
  beforeAll(async () => {
    fixture = await startRegistrationTestApp();
  });
  afterAll(async () => {
    await fixture?.close();
  });

  it('TC-827: không tạo lại phiên cho bia mộ theo ID tài khoản', async () => {
    const id = randomUUID();
    await fixture.owner.query("INSERT INTO accounts (id, display_name, deleted_at) VALUES ($1, '', now())", [
      id,
    ]);
    const sessions = createSessionRepository(createDatabase(fixture.pool));
    await expect(
      sessions.create({
        accountId: id,
        authMethod: 'local',
        csrfToken: 'test-csrf',
        expiresAt: new Date(Date.now() + 60_000),
      }),
    ).rejects.toThrow('Tài khoản không tồn tại hoặc đã bị khoá');
  });

  it('TC-827: tên xoá 89 ngày bị giữ, tên xoá 91 ngày được đăng ký trong transaction', async () => {
    for (const age of [89, 91]) {
      const usernameNormalized = `deleted.${age}`;
      await fixture.owner.query(
        `INSERT INTO deleted_usernames (username_hash, deleted_at)
         VALUES ($1, now() - ($2::int * interval '1 day'))`,
        [hashUsername(usernameNormalized), age],
      );
      const outcome = await fixture.account.accounts.register({
        usernameNormalized,
        displayName: 'Tài khoản đăng ký lại',
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$c2FsdA$aGFzaA',
        legalAcceptance: fixture.legalAcceptance,
      });
      if (age === 89) expect(outcome).toEqual({ ok: false, code: 'ERR_USERNAME_TAKEN' });
      else expect(outcome).toMatchObject({ ok: true, account: { username: usernameNormalized } });
      const result = await fixture.owner.query('SELECT id FROM accounts WHERE username_normalized = $1', [
        usernameNormalized,
      ]);
      expect(result.rowCount).toBe(age === 89 ? 0 : 1);
    }
  });
});
