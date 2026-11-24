import { randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createDatabase, type Database } from '@src/shared/db/createDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { accountCredentials, accounts } from '@src/shared/db/schema/index.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import { createCredentialRepository } from './createCredentialRepository.js';

const PASSWORD_HASH = '$argon2id$v=19$m=65536,t=3,p=1$c2FsdA$aGFzaA';
const NEXT_HASH = '$argon2id$v=19$m=65536,t=3,p=1$c2FsdEI$aGFzaEI';

describe('Repository credential local bằng role app', () => {
  let testDb: TestDatabase;
  let pool: pg.Pool;
  let db: Database;
  const insertAccount = async () => {
    const id = randomUUID();
    const username = `u.${id.slice(0, 8)}`;
    await db.insert(accounts).values({ id, usernameNormalized: username, displayName: 'Tài khoản thử' });
    return { id, username };
  };

  beforeAll(async () => {
    testDb = await startTestDatabase();
    await runMigrations(testDb.ownerUrl);
    pool = new pg.Pool({ connectionString: testDb.appUrl });
    db = createDatabase(pool);
  });

  afterAll(async () => {
    await pool?.end();
    await testDb?.container.stop();
  });

  it('TC-894 đọc credential và trạng thái account, không lấy trường riêng tư khác', async () => {
    const account = await insertAccount();
    const lockedAt = new Date('2026-11-12T01:00:00Z');
    const tempPasswordExpiresAt = new Date('2026-11-13T01:00:00Z');
    await db
      .update(accounts)
      .set({ lockedAt, mustChangePassword: true, tempPasswordExpiresAt, email: 'private@example.invalid' })
      .where(eq(accounts.id, account.id));
    const repository = createCredentialRepository(db);
    expect(await repository.insert(account.id, PASSWORD_HASH)).toBe(1);
    expect(await repository.findByUsername(account.username)).toEqual({
      accountId: account.id,
      passwordHash: PASSWORD_HASH,
      credentialVersion: 1,
      lockedAt,
      mustChangePassword: true,
      tempPasswordExpiresAt,
    });
    expect(await repository.findByUsername('unknown')).toBeNull();
  });

  it('TC-923: tra lower(email) chỉ trả credential đã xác minh', async () => {
    const account = await insertAccount();
    const repository = createCredentialRepository(db);
    await repository.insert(account.id, PASSWORD_HASH);
    await db.update(accounts).set({ email: 'LAN@Example.COM' }).where(eq(accounts.id, account.id));
    expect(await repository.findByVerifiedEmail('lan@example.com')).toBeNull();
    await db.update(accounts).set({ emailVerifiedAt: new Date() }).where(eq(accounts.id, account.id));
    expect(await repository.findByVerifiedEmail('lan@example.com')).toMatchObject({
      accountId: account.id,
      passwordHash: PASSWORD_HASH,
    });
    expect(await repository.findByVerifiedEmail('missing@example.com')).toBeNull();
  });

  it('TC-895 account chưa có credential không dùng được đăng nhập local', async () => {
    const account = await insertAccount();
    expect(await createCredentialRepository(db).findByUsername(account.username)).toBeNull();
  });

  it('TC-894 ghi một lần, không ghi đè credential khi insert trùng', async () => {
    const account = await insertAccount();
    const repository = createCredentialRepository(db);
    await repository.insert(account.id, PASSWORD_HASH);
    await expect(repository.insert(account.id, NEXT_HASH)).rejects.toThrow();
    expect((await repository.findByUsername(account.username))?.passwordHash).toBe(PASSWORD_HASH);
  });

  it('TC-894 tăng version và updated_at, từ chối ghi bằng version cũ', async () => {
    const account = await insertAccount();
    const repository = createCredentialRepository(db);
    await repository.insert(account.id, PASSWORD_HASH);
    await db
      .update(accountCredentials)
      .set({ updatedAt: new Date(0) })
      .where(eq(accountCredentials.accountId, account.id));
    expect(await repository.replace(account.id, NEXT_HASH, 1)).toBe(2);
    expect(await repository.replace(account.id, PASSWORD_HASH, 1)).toBeNull();
    expect(await repository.replace(randomUUID(), PASSWORD_HASH, 1)).toBeNull();
    expect(await repository.findByUsername(account.username)).toMatchObject({
      passwordHash: NEXT_HASH,
      credentialVersion: 2,
    });
    const [row] = await db
      .select()
      .from(accountCredentials)
      .where(eq(accountCredentials.accountId, account.id));
    expect(row!.updatedAt.getTime()).toBeGreaterThan(0);
  });

  it('TC-894 hai cập nhật cùng version chỉ có một lần thành công', async () => {
    const account = await insertAccount();
    const repository = createCredentialRepository(db);
    await repository.insert(account.id, PASSWORD_HASH);
    const results = await Promise.all([
      repository.replace(account.id, NEXT_HASH, 1),
      repository.replace(account.id, PASSWORD_HASH, 1),
    ]);
    expect(results.filter((value) => value === 2)).toHaveLength(1);
    expect(results.filter((value) => value === null)).toHaveLength(1);
    expect((await repository.findByUsername(account.username))?.credentialVersion).toBe(2);
  });

  it('TC-896 (repository) nhận transaction ngoài và rollback cả account/credential', async () => {
    const id = randomUUID();
    const failure = new Error('rollback');
    await expect(
      db.transaction(async (tx) => {
        await tx
          .insert(accounts)
          .values({ id, displayName: 'Tài khoản thử', usernameNormalized: 'rollback' });
        const repository = createCredentialRepository(tx);
        await repository.insert(id, PASSWORD_HASH);
        expect((await repository.findByUsername('rollback'))?.accountId).toBe(id);
        throw failure;
      }),
    ).rejects.toBe(failure);
    expect(await db.select().from(accounts).where(eq(accounts.id, id))).toEqual([]);
    expect(await db.select().from(accountCredentials).where(eq(accountCredentials.accountId, id))).toEqual(
      [],
    );
  });

  it('TC-907 (repository) lỗi FK/hash không biến thành kết quả thành công', async () => {
    const repository = createCredentialRepository(db);
    await expect(repository.insert(randomUUID(), PASSWORD_HASH)).rejects.toThrow();
    const account = await insertAccount();
    await expect(repository.insert(account.id, 'plaintext')).rejects.toThrow();
    expect(await repository.findByUsername(account.username)).toBeNull();
  });
});
