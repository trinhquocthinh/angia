import { createAccountLockRepository } from '@src/features/accountLock/infrastructure/createAccountLockRepository.js';
import { createRegistrationSwitchRepository } from '@src/features/registrationSwitch/infrastructure/createRegistrationSwitchRepository.js';
import { createUsernameHasher } from '@src/features/account/infrastructure/createUsernameHasher.js';
import { createEmailPasswordResets } from '@src/features/account/infrastructure/createEmailPasswordResets.js';
import { createAccountEmails } from '@src/features/account/infrastructure/createAccountEmails.js';
import { SEND_TRANSACTIONAL_EMAIL_QUEUE } from '@angia/contracts';
import { createPgBoss } from '@src/shared/queue/createPgBoss.js';
import { createSilentLogger } from './createSilentLogger.js';
import { createPasswordResetDependencies } from '@src/features/account/infrastructure/createPasswordResetDependencies.js';
import { createHouseholdDependencies } from '@src/features/household/infrastructure/createHouseholdDependencies.js';
import { createLocalCredentialLookup } from '@src/features/account/infrastructure/createLocalCredentialLookup.js';
import { createMedicationRepository } from '@src/features/medications/infrastructure/createMedicationRepository.js';
import { createLegalRepository } from '@src/features/legal/infrastructure/createLegalRepository.js';
import { createLocalCredentialEnrollments } from '@src/features/account/infrastructure/createLocalCredentialEnrollments.js';
import { createLocalPasswordChanges } from '@src/features/account/infrastructure/createLocalPasswordChanges.js';
import { createLocalLoginSessions } from '@src/features/account/infrastructure/createLocalLoginSessions.js';
import { createLocalIdentityProvider } from '@src/shared/identity/infrastructure/createLocalIdentityProvider.js';
import { createCredentialRepository } from '@src/shared/identity/infrastructure/createCredentialRepository.js';
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
import { createDatabase, type Database } from '@src/shared/db/createDatabase.js';
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

export async function startRegistrationTestApp(
  enrollmentEnabled = false,
  resetOptions: Pick<AppDependencies['account'], 'runInBackground' | 'now'> = { now: () => new Date() },
) {
  const testDb = await startTestDatabase();
  await runMigrations(testDb.ownerUrl);
  const owner = new pg.Client({ connectionString: testDb.ownerUrl });
  await owner.connect();
  const legalAcceptance = await seedLegalVersions(owner);
  const pool = new pg.Pool({ connectionString: testDb.appUrl });
  const db = createDatabase(pool);
  const boss = createPgBoss(testDb.appUrl, createSilentLogger());
  await boss.start();
  await boss.createQueue(SEND_TRANSACTIONAL_EMAIL_QUEUE);
  const hasher = createArgon2PasswordHasher();
  const identity = await createLocalIdentityProvider(createCredentialRepository(db), hasher);
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
    invitationVerifier: createInvitationVerifier(db),
    hasher,
    identity,
    localLoginSessions: createLocalLoginSessions(db),
    passwords: createLocalPasswordChanges(db),
    emailPasswordResets: createEmailPasswordResets(db, boss, 'https://angia.example/app'),
    emails: createAccountEmails(db, boss, 'https://angia.example/app'),
    ...createPasswordResetDependencies(db),
    lookupLocalCredential: createLocalCredentialLookup(db),
    enrollments: createLocalCredentialEnrollments(db),
    enrollmentEnabled: enrollmentEnabled,
    accounts: createAccountRegistrationUnitOfWork(db, createUsernameHasher('test-username-secret'.repeat(3))),
    sessions: createSessionRepository(db),
    generateToken: () => randomBytes(32).toString('base64url'),
    ...resetOptions,
  };
  const app = buildRegistrationApp(db, account);
  return {
    app,
    account,
    owner,
    pool,
    legalAcceptance,
    close: async () => {
      await boss.stop({ graceful: false });
      await owner.end();
      await pool.end();
      await testDb.container.stop();
    },
  };
}

async function seedLegalVersions(owner: pg.Client) {
  const legalAcceptance = { termsVersionId: randomUUID(), privacyVersionId: randomUUID() };
  await owner.query(
    `INSERT INTO legal_document_versions
       (id, kind, version, published_at, material, content_path, sha256)
     VALUES
       ($1, 'terms', '1.0.0', '2026-01-01', true, 'legal/terms.md', repeat('a', 64)),
       ($2, 'privacy', '1.0.0', '2026-01-01', true, 'legal/privacy.md', repeat('b', 64))`,
    [legalAcceptance.termsVersionId, legalAcceptance.privacyVersionId],
  );
  return legalAcceptance;
}

function buildRegistrationApp(db: Database, account: AppDependencies['account']) {
  const stub = createStubAuthDeps();
  return createApp({
    accountLock: { repository: createAccountLockRepository(db) },
    registrationSwitch: {
      repository: createRegistrationSwitchRepository(db),
      gate: createRegistrationGate(db),
    },
    ...createStubReviewDeps(),
    ...createHouseholdDependencies(db, account.appBaseUrl, 'test-invitation-key'.repeat(3)),
    legal: createLegalRepository(db),
    medications: createMedicationRepository(db),
    profileLinks: createStubProfileLinkDeps(),
    documents: createStubDocumentDeps(),
    profiles: createStubProfileDeps(),
    familyAdmin: createFakeFamilyAdminRepository().repository,
    aiBudget: createStubAiBudgetDeps(),
    healthProbes: { db: () => Promise.resolve(), storage: () => Promise.resolve() },
    auth: { ...stub, cookieSecret: TEST_COOKIE_SECRET, login: { ...stub.login, sessions: account.sessions } },
    account,
  });
}
