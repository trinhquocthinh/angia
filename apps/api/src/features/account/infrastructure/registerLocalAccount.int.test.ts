import { randomBytes, randomUUID } from 'node:crypto';
import { eq } from 'drizzle-orm';
import pg from 'pg';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { createSessionRepository } from '@src/shared/auth/infrastructure/createSessionRepository.js';
import { createDatabase, type Database } from '@src/shared/db/createDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { accountCredentials, accounts, legalAcceptances, sessions } from '@src/shared/db/schema/index.js';
import { createArgon2PasswordHasher } from '@src/shared/identity/infrastructure/createArgon2PasswordHasher.js';
import { startTestDatabase, type TestDatabase } from '@src/shared/test/startTestDatabase.js';
import type { RegistrationInput } from '../domain/RegistrationInput.js';
import { registerLocalAccount } from '../application/registerLocalAccount.js';
import { createAccountRegistrationUnitOfWork } from './createAccountRegistrationUnitOfWork.js';
import { createInvitationVerifier } from './createInvitationVerifier.js';
import { createLegalVersions } from './createLegalVersions.js';
import { createRegistrationGate } from './createRegistrationGate.js';

describe('Đăng ký tài khoản local trên PostgreSQL thật bằng role app (SPEC-059)', () => {
  let testDb: TestDatabase;
  let pool: pg.Pool;
  let db: Database;
  const termsId = randomUUID();
  const privacyId = randomUUID();
  const countRows = async () => ({
    accounts: await db.$count(accounts),
    credentials: await db.$count(accountCredentials),
    legal: await db.$count(legalAcceptances),
  });

  beforeAll(async () => {
    testDb = await startTestDatabase();
    await runMigrations(testDb.ownerUrl);

    const owner = new pg.Client({ connectionString: testDb.ownerUrl });
    await owner.connect();
    try {
      await owner.query(
        `INSERT INTO legal_document_versions
           (id, kind, version, published_at, material, content_path, sha256)
         VALUES
           ($1, 'terms', '1.0.0', '2026-01-01T00:00:00Z', true, 'legal/terms-1.0.md', repeat('a', 64)),
           ($2, 'privacy', '1.0.0', '2026-01-01T00:00:00Z', true, 'legal/privacy-1.0.md', repeat('b', 64))`,
        [termsId, privacyId],
      );
    } finally {
      await owner.end();
    }

    pool = new pg.Pool({ connectionString: testDb.appUrl });
    db = createDatabase(pool);
  });

  afterAll(async () => {
    await pool?.end();
    await testDb?.container.stop();
  });

  const createDeps = () => ({
    gate: createRegistrationGate(db),
    legalVersions: createLegalVersions(db, () => new Date('2026-06-01T00:00:00Z')),
    invitationVerifier: createInvitationVerifier(),
    hasher: createArgon2PasswordHasher(),
    accounts: createAccountRegistrationUnitOfWork(db),
    sessions: createSessionRepository(db),
    generateToken: () => randomBytes(32).toString('base64url'),
    now: () => new Date('2026-06-01T12:00:00Z'),
  });

  it('TC-736: tạo "Me.Lan" -> me.lan thành công, 2 acceptances, có phiên local', async () => {
    const deps = createDeps();
    const input: RegistrationInput = {
      username: 'Me.Lan',
      password: 'StrongPassword123',
      displayName: 'Mẹ Lan',
      email: 'melan@example.com',
      ageConfirmed: true,
      legalAcceptance: { termsVersionId: termsId, privacyVersionId: privacyId },
    };

    const result = await registerLocalAccount(deps, input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    expect(result.value.account.username).toBe('me.lan');
    expect(result.value.account.displayName).toBe('Mẹ Lan');
    expect(result.value.account.familyId).toBeNull();
    expect(result.value.session.sessionId).toBeDefined();

    // Kiểm tra trong DB
    const [acc] = await db.select().from(accounts).where(eq(accounts.id, result.value.account.id));
    expect(acc?.usernameNormalized).toBe('me.lan');
    expect(acc?.email).toBe('melan@example.com');
    expect(acc?.legalRef).toBeDefined();

    // Kiểm tra credential
    const [cred] = await db
      .select()
      .from(accountCredentials)
      .where(eq(accountCredentials.accountId, result.value.account.id));
    expect(cred?.credentialVersion).toBe(1);
    expect(await deps.hasher.verify(cred!.passwordHash, 'StrongPassword123')).toBe(true);

    // Kiểm tra 2 dòng legal_acceptances
    const acceptances = await db
      .select()
      .from(legalAcceptances)
      .where(eq(legalAcceptances.accountRef, acc!.legalRef));
    expect(acceptances).toHaveLength(2);

    // Kiểm tra session có auth_method = 'local'
    const [sess] = await db.select().from(sessions).where(eq(sessions.id, result.value.session.sessionId));
    expect(sess?.authMethod).toBe('local');
  });

  it('TC-737: trùng "ME.LAN" trả ERR_USERNAME_TAKEN, không ghi credential', async () => {
    const deps = createDeps();
    const input: RegistrationInput = {
      username: 'ME.LAN',
      password: 'AnotherPassword123',
      displayName: 'Mẹ Lan 2',
      ageConfirmed: true,
      legalAcceptance: { termsVersionId: termsId, privacyVersionId: privacyId },
    };

    const before = await countRows();
    const result = await registerLocalAccount(deps, input);
    expect(result).toEqual({ ok: false, code: 'ERR_USERNAME_TAKEN' });
    expect(await countRows()).toEqual(before);
  });

  it('TC-737: race unique violation (23505) trong transaction trả ERR_USERNAME_TAKEN', async () => {
    const uow = createAccountRegistrationUnitOfWork(db);
    const hash = '$argon2id$v=19$m=65536,t=3,p=1$c2FsdA$aGFzaA';
    const record = {
      usernameNormalized: 'me.lan', // đã tồn tại từ TC-736
      passwordHash: hash,
      displayName: 'Race User',
      legalAcceptance: { termsVersionId: termsId, privacyVersionId: privacyId },
    };

    const before = await countRows();
    const outcome = await uow.register(record);
    expect(outcome).toEqual({ ok: false, code: 'ERR_USERNAME_TAKEN' });
    expect(await countRows()).toEqual(before);
  });

  it('TC-738: tạo tài khoản không có email thành công trên DB thật', async () => {
    const deps = createDeps();
    const input: RegistrationInput = {
      username: 'no.email.user',
      password: 'Password123',
      displayName: 'Người Dùng Không Email',
      ageConfirmed: true,
      legalAcceptance: { termsVersionId: termsId, privacyVersionId: privacyId },
    };

    const result = await registerLocalAccount(deps, input);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const [acc] = await db.select().from(accounts).where(eq(accounts.id, result.value.account.id));
    expect(acc?.email).toBeNull();
  });

  it('TC-742: phiên bản pháp lý cũ trả ERR_LEGAL_VERSION_OUTDATED kèm current', async () => {
    const deps = createDeps();
    const input: RegistrationInput = {
      username: 'outdated.user',
      password: 'Password123',
      displayName: 'Người Dùng Điều Khoản Cũ',
      ageConfirmed: true,
      legalAcceptance: {
        termsVersionId: randomUUID(), // Không khớp bản hiện hành
        privacyVersionId: privacyId,
      },
    };

    const result = await registerLocalAccount(deps, input);
    expect(result).toEqual({
      ok: false,
      code: 'ERR_LEGAL_VERSION_OUTDATED',
      details: { current: { termsVersionId: termsId, privacyVersionId: privacyId } },
    });
  });

  it('TC-743/TC-896: lỗi FK legal version trong transaction rollback toàn bộ, không mồ côi', async () => {
    const uow = createAccountRegistrationUnitOfWork(db);
    const hash = '$argon2id$v=19$m=65536,t=3,p=1$c2FsdA$aGFzaA';
    const nonExistentVersionId = randomUUID();
    const record = {
      usernameNormalized: 'rollback.user',
      passwordHash: hash,
      displayName: 'Người Dùng Rollback',
      legalAcceptance: {
        termsVersionId: nonExistentVersionId, // FK violation trên legal_acceptances
        privacyVersionId: privacyId,
      },
    };

    const before = await countRows();
    await expect(uow.register(record)).rejects.toThrow();

    // Lỗi ở bước legal (sau account + credential) phải rollback cả ba bảng.
    expect(await countRows()).toEqual(before);
    const [acc] = await db.select().from(accounts).where(eq(accounts.usernameNormalized, 'rollback.user'));
    expect(acc).toBeUndefined();
  });

  it('TC-896: lỗi membership (nhà không tồn tại) rollback account/credential/legal', async () => {
    const before = await countRows();
    const record = {
      usernameNormalized: 'member.rollback',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=1$c2FsdA$aGFzaA',
      displayName: 'Người Dùng Lời Mời',
      familyId: randomUUID(),
      familyRole: 'member' as const,
      legalAcceptance: { termsVersionId: termsId, privacyVersionId: privacyId },
    };

    await expect(createAccountRegistrationUnitOfWork(db).register(record)).rejects.toThrow();
    expect(await countRows()).toEqual(before);
  });
});
