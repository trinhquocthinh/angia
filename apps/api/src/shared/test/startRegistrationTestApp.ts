import { createRateLimitStore } from '@src/shared/rateLimit/infrastructure/createRateLimitStore.js';
import { createRateLimitKeyHasher } from '@src/shared/rateLimit/infrastructure/createRateLimitKeyHasher.js';
import { randomBytes, randomUUID } from 'node:crypto';
import pg from 'pg';
import { createApp, type AppDependencies } from '@src/createApp.js';
import { createAccountRegistrationUnitOfWork } from '@src/features/account/infrastructure/createAccountRegistrationUnitOfWork.js';
import { createInvitationVerifier } from '@src/features/account/infrastructure/createInvitationVerifier.js';
import { createLegalVersions } from '@src/features/account/infrastructure/createLegalVersions.js';
import { createRegistrationGate } from '@src/features/account/infrastructure/createRegistrationGate.js';
import { createSessionRepository } from '@src/shared/auth/infrastructure/createSessionRepository.js';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { createArgon2PasswordHasher } from '@src/shared/identity/infrastructure/createArgon2PasswordHasher.js';
import { createFakeFamilyAdminRepository } from './createFakeFamilyAdminRepository.js';
import { createStubAiBudgetDeps } from './createStubAiBudgetDeps.js';
import { createStubAuthDeps } from './createStubAuthDeps.js';
import { createStubDocumentDeps } from './createStubDocumentDeps.js';
import { createStubProfileDeps } from './createStubProfileDeps.js';
import { createStubProfileLinkDeps } from './createStubProfileLinkDeps.js';
import { createStubReviewDeps } from './createStubReviewDeps.js';
import { TEST_COOKIE_SECRET } from './seedAuthFixtures.js';
import { startTestDatabase } from './startTestDatabase.js';

export async function startRegistrationTestApp() {
  const testDb = await startTestDatabase();
  await runMigrations(testDb.ownerUrl);
  const owner = new pg.Client({ connectionString: testDb.ownerUrl });
  await owner.connect();
  const legalAcceptance = { termsVersionId: randomUUID(), privacyVersionId: randomUUID() };
  await owner.query(
    `INSERT INTO legal_document_versions
       (id, kind, version, published_at, material, content_path, sha256)
     VALUES
       ($1, 'terms', '1.0.0', '2026-01-01', true, 'legal/terms.md', repeat('a', 64)),
       ($2, 'privacy', '1.0.0', '2026-01-01', true, 'legal/privacy.md', repeat('b', 64))`,
    [legalAcceptance.termsVersionId, legalAcceptance.privacyVersionId],
  );
  const pool = new pg.Pool({ connectionString: testDb.appUrl });
  const db = createDatabase(pool);
  const sessions = createSessionRepository(db);
  const stub = createStubAuthDeps();
  const account: AppDependencies['account'] = {
    clientIp: (c) => c.req.header('x-test-ip') ?? 'test',
    rateLimit: {
      store: createRateLimitStore(db),
      keyHasher: createRateLimitKeyHasher(TEST_COOKIE_SECRET),
      now: Date.now,
    },
    appBaseUrl: 'https://angia.example/app',
    gate: createRegistrationGate(db),
    legalVersions: createLegalVersions(db, () => new Date()),
    invitationVerifier: createInvitationVerifier(),
    hasher: createArgon2PasswordHasher(),
    accounts: createAccountRegistrationUnitOfWork(db),
    sessions,
    generateToken: () => randomBytes(32).toString('base64url'),
    now: () => new Date(),
  };
  const app = createApp({
    ...createStubReviewDeps(),
    profileLinks: createStubProfileLinkDeps(),
    documents: createStubDocumentDeps(),
    profiles: createStubProfileDeps(),
    familyAdmin: createFakeFamilyAdminRepository().repository,
    aiBudget: createStubAiBudgetDeps(),
    healthProbes: { db: () => Promise.resolve(), storage: () => Promise.resolve() },
    auth: { ...stub, cookieSecret: TEST_COOKIE_SECRET, login: { ...stub.login, sessions } },
    account,
  });
  return {
    app,
    account,
    owner,
    pool,
    legalAcceptance,
    close: async () => {
      await owner.end();
      await pool.end();
      await testDb.container.stop();
    },
  };
}
