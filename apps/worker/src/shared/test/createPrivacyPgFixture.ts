import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
const OWNER = 'angia_privacy_worker';
const APP = 'angia_privacy_worker_app';
const migrations = fileURLToPath(new URL('../../../../api/drizzle', import.meta.url));
export async function createPrivacyPgFixture() {
  const container = await new PostgreSqlContainer('postgres:16-alpine')
    .withDatabase(OWNER)
    .withUsername(OWNER)
    .withPassword(OWNER)
    .start();
  const owner = new pg.Client({ connectionString: container.getConnectionUri() });
  await owner.connect();
  await owner.query(`CREATE ROLE ${APP} LOGIN PASSWORD '${APP}' NOBYPASSRLS;
    GRANT USAGE ON SCHEMA public TO ${APP};
    ALTER DEFAULT PRIVILEGES FOR ROLE ${OWNER} IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${APP};`);
  await migrate(drizzle(owner), { migrationsFolder: migrations });
  const url = new URL(container.getConnectionUri());
  url.username = APP;
  url.password = APP;
  const pool = new pg.Pool({ connectionString: url.toString(), max: 4 });
  return {
    owner,
    pool,
    appUrl: url.toString(),
    seed: () => seed(owner),
    close: async () => {
      await pool.end();
      await owner.end();
      await container.stop();
    },
  };
}
async function seed(owner: pg.Client) {
  const [familyId, profileId, accountId, batchId, documentId, draftId] = [
    randomUUID(),
    randomUUID(),
    randomUUID(),
    randomUUID(),
    randomUUID(),
    randomUUID(),
  ] as const;
  await owner.query(`INSERT INTO families(id,name) VALUES ($1,'Nhà')`, [familyId]);
  await owner.query(
    `INSERT INTO accounts(id,oidc_subject,display_name,family_id,family_role) VALUES ($1,$3,'Main',$2,'main')`,
    [accountId, familyId, `sub-${accountId}`],
  );
  await owner.query(`INSERT INTO health_profiles(id,family_id,display_name) VALUES ($1,$2,'Mẹ')`, [
    profileId,
    familyId,
  ]);
  await owner.query(
    `INSERT INTO upload_batches(id,family_id,health_profile_id,created_by) VALUES ($1,$2,$3,$4)`,
    [batchId, familyId, profileId, accountId],
  );
  await owner.query(
    `INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,status,original_key,mime_type,size_bytes,privacy_draft_id,privacy_draft_status)
    VALUES ($1,$2,$3,$4,'awaiting_privacy','original','image/png',1,$5,'pending')`,
    [documentId, familyId, profileId, batchId, draftId],
  );
  return { familyId, documentId, draftId };
}
