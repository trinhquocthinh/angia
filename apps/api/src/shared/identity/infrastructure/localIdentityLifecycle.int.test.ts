import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sql } from 'drizzle-orm';
import { createSessionRepository } from '@src/shared/auth/infrastructure/createSessionRepository.js';
import { createDatabase, type Database } from '@src/shared/db/createDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { createCredentialRepository } from './createCredentialRepository.js';
import { createLocalIdentityLifecycle } from './createLocalIdentityLifecycle.js';

const hash = '$argon2id$v=19$m=65536,t=3,p=1$c2FsdA$aGFzaA';
const now = new Date('2026-11-12T01:00:00Z');
let fixture: TestDatabase;
let owner: pg.Client;
let pool: pg.Pool;
let db: Database;
async function seed() {
  const [id, familyId] = [randomUUID(), randomUUID()];
  await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà thử')", [familyId]);
  await owner.query(
    `INSERT INTO accounts(id,display_name,family_id,username_normalized)
    VALUES($1,'Tài khoản thử',$2,$3)`,
    [id, familyId, id.slice(0, 8)],
  );
  await createCredentialRepository(db).insert(id, hash);
  for (const method of ['local', 'oidc']) {
    await owner.query(
      `INSERT INTO sessions(id,account_id,csrf_token,expires_at,auth_method)
      VALUES(gen_random_uuid(),$1,'csrf',now()+interval '1 day',$2)`,
      [id, method],
    );
    await owner.query(
      `INSERT INTO push_subscriptions(id,family_id,account_id,auth_method,
      authorized_at,endpoint,endpoint_hash,p256dh,auth) VALUES(gen_random_uuid(),$1,$2,$3,now(),$4,$4,'key','auth')`,
      [familyId, id, method, randomUUID()],
    );
  }
  return id;
}
async function state(id: string) {
  return {
    account: (await owner.query('SELECT locked_at,lock_reason FROM accounts WHERE id=$1', [id])).rows,
    version: (
      await owner.query('SELECT credential_version FROM account_credentials WHERE account_id=$1', [id])
    ).rows,
    sessions: (await owner.query('SELECT id FROM sessions WHERE account_id=$1', [id])).rowCount,
    push: (await owner.query('SELECT id FROM push_subscriptions WHERE account_id=$1', [id])).rowCount,
  };
}
async function waitForAccountLock() {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const rows = await owner.query(`SELECT 1 FROM pg_stat_activity WHERE usename='angia_test_app'
      AND wait_event_type='Lock' AND query ILIKE '%accounts%'`);
    if (rows.rowCount) return true;
    await new Promise((resolve) => setTimeout(resolve, 10));
  }
  return false;
}
beforeAll(async () => {
  fixture = await startTestDatabase();
  await runMigrations(fixture.ownerUrl);
  owner = new pg.Client({ connectionString: fixture.ownerUrl });
  await owner.connect();
  pool = new pg.Pool({ connectionString: fixture.appUrl });
  db = createDatabase(pool);
});
afterAll(async () => {
  await pool?.end();
  await owner?.end();
  await fixture?.container.stop();
});
describe('Lifecycle local nguyên tử bằng role app', () => {
  it('TC-904: khoá thu hồi cả hai nguồn, tăng version; mở khoá không hồi sinh', async () => {
    const id = await seed();
    const lifecycle = createLocalIdentityLifecycle(db);
    expect(await lifecycle.lock(id, 'Lạm dụng', now)).toBe(true);
    expect(await state(id)).toEqual({
      account: [{ locked_at: now, lock_reason: 'Lạm dụng' }],
      version: [{ credential_version: 2 }],
      sessions: 0,
      push: 0,
    });
    expect(await lifecycle.unlock(id)).toBe(true);
    expect(await state(id)).toEqual({
      account: [{ locked_at: null, lock_reason: null }],
      version: [{ credential_version: 2 }],
      sessions: 0,
      push: 0,
    });
  });

  it('TC-904: revokeAll không khoá account nhưng vô hiệu snapshot credential cũ', async () => {
    const id = await seed();
    expect(await createLocalIdentityLifecycle(db).revokeAll(id)).toBe(true);
    expect(await state(id)).toEqual({
      account: [{ locked_at: null, lock_reason: null }],
      version: [{ credential_version: 2 }],
      sessions: 0,
      push: 0,
    });
  });

  it('TC-904: xoá account xoá credential/phiên/Push, không xoá gia đình', async () => {
    const id = await seed();
    const before = (await owner.query('SELECT count(*) FROM families')).rows;
    expect(await createLocalIdentityLifecycle(db).deleteUser(id)).toBe(true);
    expect(await state(id)).toEqual({ account: [], version: [], sessions: 0, push: 0 });
    expect((await owner.query('SELECT count(*) FROM families')).rows).toEqual(before);
    for (const action of ['unlock', 'revokeAll', 'deleteUser'] as const)
      expect(await createLocalIdentityLifecycle(db)[action](id)).toBe(false);
    expect(await createLocalIdentityLifecycle(db).lock(id, 'Lạm dụng', now)).toBe(false);
  });

  it('TC-904: transaction ngoài rollback trạng thái, version và thu hồi', async () => {
    const id = await seed();
    const before = await state(id);
    await expect(
      db.transaction(async (tx) => {
        await createLocalIdentityLifecycle(tx).lock(id, 'Lạm dụng', now);
        throw new Error('rollback');
      }),
    ).rejects.toThrow('rollback');
    expect(await state(id)).toEqual(before);
  });

  it('TC-904: lỗi xoá Push rollback cả trạng thái và phiên', async () => {
    const id = await seed();
    const before = await state(id);
    await owner.query(`CREATE FUNCTION fail_local_push() RETURNS trigger LANGUAGE plpgsql AS
      $$ BEGIN RAISE EXCEPTION 'push failure'; END $$;
      CREATE TRIGGER fail_local_push BEFORE DELETE ON push_subscriptions
      FOR EACH ROW EXECUTE FUNCTION fail_local_push()`);
    try {
      await expect(createLocalIdentityLifecycle(db).lock(id, 'Lạm dụng', now)).rejects.toThrow();
      expect(await state(id)).toEqual(before);
    } finally {
      await owner.query(
        'DROP TRIGGER fail_local_push ON push_subscriptions; DROP FUNCTION fail_local_push()',
      );
    }
  });

  it('TC-904: khoá đợi transaction giữ account; thu hồi cả phiên vừa commit', async () => {
    const id = await seed();
    const client = await pool.connect();
    let pending: Promise<boolean> | undefined;
    try {
      await client.query('BEGIN');
      await client.query('SELECT id FROM accounts WHERE id=$1 FOR UPDATE', [id]);
      pending = createLocalIdentityLifecycle(db).lock(id, 'Lạm dụng', now);
      expect(await waitForAccountLock()).toBe(true);
      await client.query(
        `INSERT INTO sessions(id,account_id,csrf_token,expires_at,auth_method)
        VALUES(gen_random_uuid(),$1,'race',now()+interval '1 day','local')`,
        [id],
      );
      await client.query('COMMIT');
      expect(await pending).toBe(true);
      expect((await state(id)).sessions).toBe(0);
      await createLocalIdentityLifecycle(db).unlock(id);
      // Hợp đồng recheck S4-T1: snapshot trước hash không còn hợp lệ kể cả đã mở khoá.
      await db.transaction(async (tx) => {
        const result = await tx.execute(sql`SELECT c.credential_version FROM accounts a
          JOIN account_credentials c ON c.account_id=a.id
          WHERE a.id=${id} AND a.locked_at IS NULL AND c.credential_version=1 FOR UPDATE OF a`);
        expect(result.rows).toEqual([]);
      });
    } finally {
      await client.query('ROLLBACK');
      client.release();
      await pending;
    }
  });
  it('TC-904: thu hồi/xoá đều rollback qua transaction ngoài', async () => {
    for (const action of ['revokeAll', 'deleteUser'] as const) {
      const id = await seed();
      const before = await state(id);
      await expect(
        db.transaction(async (tx) => {
          await createLocalIdentityLifecycle(tx)[action](id);
          throw new Error('rollback');
        }),
      ).rejects.toThrow('rollback');
      expect(await state(id)).toEqual(before);
    }
  });
  it('TC-904: repository cấp phiên hiện có từ chối account đã khoá hoặc đã xoá', async () => {
    const id = await seed();
    const lifecycle = createLocalIdentityLifecycle(db);
    const sessions = createSessionRepository(db);
    const session = { accountId: id, csrfToken: 'race', expiresAt: new Date(Date.now() + 60000) };
    await lifecycle.lock(id, 'Lạm dụng', now);
    await expect(sessions.create(session)).rejects.toThrow();
    await lifecycle.unlock(id);
    expect((await state(id)).sessions).toBe(0);
    await lifecycle.deleteUser(id);
    await expect(sessions.create(session)).rejects.toThrow();
  });

  it('TC-904: cấp phiên đợi khoá/xoá commit rồi từ chối, không để phiên sống lại', async () => {
    for (const action of ['lock', 'deleteUser'] as const) {
      const id = await seed();
      let pending: Promise<unknown> | undefined;
      await db.transaction(async (tx) => {
        const lifecycle = createLocalIdentityLifecycle(tx);
        if (action === 'lock') await lifecycle.lock(id, 'Lạm dụng', now);
        else await lifecycle.deleteUser(id);
        pending = createSessionRepository(db)
          .create({ accountId: id, csrfToken: 'race', expiresAt: new Date(Date.now() + 60000) })
          .catch((error: unknown) => error);
        expect(await waitForAccountLock()).toBe(true);
      });
      expect(await pending).toBeInstanceOf(Error);
      await createLocalIdentityLifecycle(db).unlock(id);
      expect((await state(id)).sessions).toBe(0);
    }
  });
});
