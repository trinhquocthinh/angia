import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
const OWNER = 'angia_sanitize_worker';
const APP = 'angia_sanitize_worker_app';
const migrations = fileURLToPath(new URL('../../../../api/drizzle', import.meta.url));
export async function createSanitizePgFixture() {
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
    seed: (approved = true) => seed(owner, approved),
    close: async () => {
      await pool.end();
      await owner.end();
      await container.stop();
    },
  };
}
async function seed(owner: pg.Client, approved: boolean) {
  const [familyId, profileId, accountId, batchId, documentId] = [
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
  const oldKey = `families/${familyId}/profiles/${profileId}/documents/${documentId}/upload.jpg`;
  await owner.query(
    `INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,status,image_key,mime_type,size_bytes,privacy_approved_by,privacy_approved_at)
     VALUES ($1,$2,$3,$4,'uploaded',$5,'image/jpeg',1,$6,$7)`,
    [
      documentId,
      familyId,
      profileId,
      batchId,
      oldKey,
      approved ? accountId : null,
      approved ? new Date() : null,
    ],
  );
  return { familyId, documentId, oldKey };
}
