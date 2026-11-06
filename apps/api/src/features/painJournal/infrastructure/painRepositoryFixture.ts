import { randomUUID } from 'node:crypto';
import pg from 'pg';
import { createDatabase } from '@src/shared/db/createDatabase.js';
import { runMigrations } from '@src/shared/db/runMigrations.js';
import { startTestDatabase } from '@src/shared/test/startTestDatabase.js';
import { withSelfScope } from '@src/shared/db/withSelfScope.js';
import type { FamilyScope } from '@src/shared/db/withFamilyScope.js';
import { drizzlePainIssueRepository } from './drizzlePainIssueRepository.js';
import { openPainIssue } from '../application/openPainIssue.js';
import type { PainIssueOutcome } from '../application/ports.js';

export const painNow = () => new Date('2026-11-06T10:00:00.000Z');

export function unwrapPain<T>(result: PainIssueOutcome<T>): T {
  if (!result.ok) throw new Error(JSON.stringify(result));
  return result.value;
}

export async function painRepositoryFixture() {
  const database = await startTestDatabase();
  await runMigrations(database.ownerUrl);
  const owner = new pg.Pool({ connectionString: database.ownerUrl });
  const pool = new pg.Pool({ connectionString: database.appUrl, max: 6 });
  const db = createDatabase(pool);
  const repository = drizzlePainIssueRepository(db);
  const profile = async (familyId = randomUUID()) => {
    const profileId = randomUUID();
    const accountId = randomUUID();
    await owner.query("INSERT INTO families(id,name) VALUES($1,'Nhà') ON CONFLICT DO NOTHING", [familyId]);
    await owner.query(
      `INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role)
       VALUES($1::uuid,$1::text,'Người ghi',$2,'main')`,
      [accountId, familyId],
    );
    await owner.query(
      `INSERT INTO health_profiles(id,family_id,display_name,consent_status,consent_source,
       consent_basis,consent_respondent_name,consent_confirmed_at,consent_confirmed_by)
       VALUES($1,$2,'Mẹ','confirmed','main_attested','guardian','Người ghi',now(),$3)`,
      [profileId, familyId, accountId],
    );
    return { familyId, profileId, accountId };
  };
  const open = async (session: Awaited<ReturnType<typeof profile>>, side: 'left' | 'right' = 'left') =>
    unwrapPain(
      await openPainIssue(
        repository,
        session,
        {
          region: 'knee',
          side,
          firstEntry: { level: 6, recordedAt: '2026-11-05T17:00:00.000Z' },
        },
        painNow,
      ),
    );
  const self = (profileId: string) => {
    const scope: FamilyScope = (scopedDb, familyId, work) =>
      withSelfScope(scopedDb, { familyId, profileId }, work);
    return drizzlePainIssueRepository(db, scope);
  };
  return {
    db,
    owner,
    pool,
    repository,
    profile,
    open,
    self,
    stop: async () => {
      await pool.end();
      await owner.end();
      await database.container.stop();
    },
  };
}

export type PainRepositoryFixture = Awaited<ReturnType<typeof painRepositoryFixture>>;
