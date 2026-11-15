import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { createLocalIdentityLifecycle } from '@src/shared/identity/infrastructure/createLocalIdentityLifecycle.js';
import { startRegistrationTestApp } from '@src/shared/test/startRegistrationTestApp.js';
import { createLocalLoginSessions } from './createLocalLoginSessions.js';

describe('Cấp phiên local dưới khoá account PostgreSQL', () => {
  let t: Awaited<ReturnType<typeof startRegistrationTestApp>>;
  beforeAll(async () => {
    t = await startRegistrationTestApp();
  });
  afterAll(async () => {
    await t?.close();
  });
  async function seed() {
    const accountId = randomUUID();
    await t.owner.query("INSERT INTO accounts(id,display_name) VALUES($1,'Thử')", [accountId]);
    await t.owner.query('INSERT INTO account_credentials(account_id,password_hash) VALUES($1,$2)', [
      accountId,
      '$argon2id$v=19$m=65536,t=3,p=1$c2FsdA$aGFzaA',
    ]);
    return {
      accountId,
      expectedCredentialVersion: 1,
      csrfToken: 'csrf',
      expiresAt: new Date(Date.now() + 86400000),
      passwordChangeRequired: false,
    };
  }
  const count = async (id: string) =>
    (await t.pool.query('SELECT id FROM sessions WHERE account_id=$1', [id])).rowCount;
  async function waitForLock() {
    const deadline = Date.now() + 5000;
    while (Date.now() < deadline) {
      const r = await t.owner.query(
        "SELECT 1 FROM pg_stat_activity WHERE usename='angia_test_app' AND wait_event_type='Lock'",
      );
      if (r.rowCount) return true;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return false;
  }
  it('ghi nguồn local và cờ hạn chế vào DB', async () => {
    const input = { ...(await seed()), passwordChangeRequired: true };
    const result = await createLocalLoginSessions(createDatabase(t.pool)).createIfCurrent(input);
    expect(result).toMatchObject({ ok: true, sessionId: expect.any(String) });
    expect(
      (
        await t.pool.query(
          'SELECT auth_method,password_change_required,csrf_token,expires_at FROM sessions WHERE account_id=$1',
          [input.accountId],
        )
      ).rows,
    ).toEqual([
      {
        auth_method: 'local',
        password_change_required: true,
        csrf_token: 'csrf',
        expires_at: input.expiresAt,
      },
    ]);
  });
  it('TC-903: snapshot hash cũ đua đổi version không tạo phiên', async () => {
    const input = await seed();
    await t.owner.query('UPDATE account_credentials SET credential_version=2 WHERE account_id=$1', [
      input.accountId,
    ]);
    expect(await createLocalLoginSessions(createDatabase(t.pool)).createIfCurrent(input)).toEqual({
      ok: false,
      reason: 'stale',
    });
    expect(await count(input.accountId)).toBe(0);
  });
  it.each(['lock', 'deleteUser'] as const)(
    'TC-904: login đợi %s commit, từ chối và unlock không hồi sinh',
    async (action) => {
      const input = await seed();
      const db = createDatabase(t.pool);
      const client = await t.pool.connect();
      let pending: ReturnType<ReturnType<typeof createLocalLoginSessions>['createIfCurrent']> | undefined;
      try {
        await client.query('BEGIN');
        await client.query('SELECT id FROM accounts WHERE id=$1 FOR UPDATE', [input.accountId]);
        if (action === 'lock') {
          await client.query('UPDATE accounts SET locked_at=now() WHERE id=$1', [input.accountId]);
          await client.query('UPDATE account_credentials SET credential_version=2 WHERE account_id=$1', [
            input.accountId,
          ]);
        } else await client.query('DELETE FROM accounts WHERE id=$1', [input.accountId]);
        pending = createLocalLoginSessions(db).createIfCurrent(input);
        expect(await waitForLock()).toBe(true);
        await client.query('COMMIT');
        expect(await pending).toEqual({ ok: false, reason: action === 'lock' ? 'locked' : 'gone' });
        await createLocalIdentityLifecycle(db).unlock(input.accountId);
        expect(await createLocalLoginSessions(db).createIfCurrent(input)).toEqual({
          ok: false,
          reason: action === 'lock' ? 'stale' : 'gone',
        });
        expect(await count(input.accountId)).toBe(0);
      } finally {
        await client.query('ROLLBACK');
        client.release();
        await pending;
      }
    },
  );
  it('TC-904: lock rồi unlock trong lúc hash vẫn vô hiệu snapshot cũ', async () => {
    const input = await seed();
    const db = createDatabase(t.pool);
    const lifecycle = createLocalIdentityLifecycle(db);
    await lifecycle.lock(input.accountId, 'Thử', new Date());
    await lifecycle.unlock(input.accountId);
    expect(await createLocalLoginSessions(db).createIfCurrent(input)).toEqual({ ok: false, reason: 'stale' });
    expect(await count(input.accountId)).toBe(0);
  });
  it('lỗi INSERT rollback và nhả khoá, không có phiên', async () => {
    const input = await seed();
    const repository = createLocalLoginSessions(createDatabase(t.pool));
    await expect(
      repository.createIfCurrent({ ...input, csrfToken: null as unknown as string }),
    ).rejects.toThrow();
    expect(await count(input.accountId)).toBe(0);
    expect(await repository.createIfCurrent(input)).toMatchObject({ ok: true });
  });
});
