import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { createApp } from '@src/createApp.js';
import { createFamilyAdminRepository } from '@src/features/family/infrastructure/createFamilyAdminRepository.js';
import { createSessionRepository } from '@src/shared/auth/infrastructure/createSessionRepository.js';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { createStubAuthDeps } from './createStubAuthDeps.js';
import { type SeededSession, seedAccount, seedSession, TEST_COOKIE_SECRET } from './seedAuthFixtures.js';
import { startTestDatabase } from './startTestDatabase.js';

interface MembershipRow {
  family_id: string | null;
  family_role: 'main' | 'member' | null;
  health_profile_id: string | null;
}

// App thật trên PostgreSQL Testcontainers (role app NOBYPASSRLS) cho test route /api/admin/*.
export async function startAdminTestApp() {
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
      login: { ...stub.login, sessions: createSessionRepository(database) },
      cookieSecret: TEST_COOKIE_SECRET,
    },
    familyAdmin: createFamilyAdminRepository(database),
  });

  const call = (session: SeededSession, method: string, path: string, body?: unknown) =>
    app.request(path, {
      method,
      headers: { cookie: session.cookie, 'x-csrf-token': session.csrf, 'content-type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  const seedFamily = async (name = 'Nhà') => {
    const id = randomUUID();
    await owner.query(`INSERT INTO families (id, name) VALUES ($1, $2)`, [id, name]);
    return id;
  };

  const membershipOf = async (accountId: string) =>
    (
      await owner.query<MembershipRow>(
        `SELECT family_id, family_role, health_profile_id FROM accounts WHERE id = $1`,
        [accountId],
      )
    ).rows[0];

  const admin = await seedSession(owner, await seedAccount(owner, { admin: true }));

  const stop = async () => {
    await pool.end();
    await owner.end();
    await db.container.stop();
  };

  return { app, owner, admin, call, seedFamily, membershipOf, stop };
}

export type AdminTestApp = Awaited<ReturnType<typeof startAdminTestApp>>;
