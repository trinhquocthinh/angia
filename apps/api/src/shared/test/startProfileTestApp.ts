import { createInvitationRepository } from '@src/features/consentInvitations/infrastructure/createInvitationRepository.js';
import { createInvitationTokenCodec } from '@src/features/consentInvitations/infrastructure/createInvitationTokenCodec.js';
import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { createApp } from '@src/createApp.js';
import { createProfileRepository } from '@src/features/profiles/infrastructure/createProfileRepository.js';
import { createSessionRepository } from '@src/shared/auth/infrastructure/createSessionRepository.js';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { createStubAuthDeps } from './createStubAuthDeps.js';
import { createFakeFamilyAdminRepository } from './createFakeFamilyAdminRepository.js';
import { seedAccount, seedSession, TEST_COOKIE_SECRET, type SeededSession } from './seedAuthFixtures.js';
import { startTestDatabase } from './startTestDatabase.js';

export async function startProfileTestApp(appBaseUrl = 'http://localhost:5173') {
  const db = await startTestDatabase();
  await runMigrations(db.ownerUrl);
  const owner = new pg.Client({ connectionString: db.ownerUrl });
  await owner.connect();
  const pool = new pg.Pool({ connectionString: db.appUrl });
  const database = createDatabase(pool);
  const stub = createStubAuthDeps();
  const app = createApp({
    healthProbes: { db: () => Promise.resolve(), storage: () => Promise.resolve() },
    auth: {
      ...stub,
      cookieSecret: TEST_COOKIE_SECRET,
      login: { ...stub.login, sessions: createSessionRepository(database) },
    },
    familyAdmin: createFakeFamilyAdminRepository().repository,
    profiles: createProfileRepository(database),
    consentInvitations: {
      repository: createInvitationRepository(database),
      codec: createInvitationTokenCodec(TEST_COOKIE_SECRET),
      now: () => new Date(),
      newId: randomUUID,
      appBaseUrl,
    },
  });
  const family = async () => {
    const id = randomUUID();
    await owner.query('INSERT INTO families(id,name) VALUES ($1,$2)', [id, 'Nhà']);
    return id;
  };
  const session = async (
    familyId: string,
    role: 'main' | 'member' = 'main',
    displayName = 'Người chăm',
    admin = false,
  ) => seedSession(owner, await seedAccount(owner, { familyId, familyRole: role, displayName, admin }));
  const call = (user: SeededSession, method: string, path: string, body?: unknown) =>
    app.request(path, {
      method,
      headers: { cookie: user.cookie, 'x-csrf-token': user.csrf, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  const stop = async () => {
    await pool.end();
    await owner.end();
    await db.container.stop();
  };
  return {
    app,
    owner,
    pool,
    family,
    session,
    call,
    stop,
    database,
    codec: createInvitationTokenCodec(TEST_COOKIE_SECRET),
  };
}
export type ProfileTestApp = Awaited<ReturnType<typeof startProfileTestApp>>;
