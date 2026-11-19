import { randomUUID } from 'node:crypto';
import type pg from 'pg';
import type { PgBoss } from 'pg-boss';
import { vi } from 'vitest';
import type { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { executeFamilyDeletion } from '../application/executeFamilyDeletion.js';
import { createFamilyDeletionRepository } from './createFamilyDeletionRepository.js';

type Fixture = Awaited<ReturnType<typeof createSanitizePgFixture>>;
const logger = { info: vi.fn(), warn: vi.fn(), error: vi.fn() };

// Bộ chạy job xoá nhà trên PostgreSQL thật + S3 giả; `getFx` lấy fixture sau beforeAll.
export function useDeletionHarness(getFx: () => Fixture) {
  const fx = new Proxy({} as Fixture, { get: (_t, key) => getFx()[key as keyof Fixture] });
  const send = vi.fn(async (..._args: unknown[]) => 'job');
  const objects = new Set<string>();
  const run = (pool: pg.Pool = fx.pool) =>
    executeFamilyDeletion({
      repository: createFamilyDeletionRepository(pool, { send } as unknown as PgBoss),
      storage: {
        async *list(prefix) {
          for (const key of [...objects]) if (key.startsWith(prefix)) yield { key };
        },
        delete: async (key) => void objects.delete(key),
      },
      logger,
    });
  const seed = (due = true) => seedDueFamily(fx, objects, due);
  return { send, objects, run, seed };
}

// Nhà có Chủ hộ + dữ liệu sức khỏe + ảnh + các bảng cấp nhà; yêu cầu xoá đã đến hạn.
async function seedDueFamily(fx: Fixture, objects: Set<string>, due = true) {
  const { familyId, documentId, oldKey } = await fx.seed();
  const accountId = (await fx.owner.query('SELECT id FROM accounts WHERE family_id=$1', [familyId])).rows[0]
    .id as string;
  const profileId = (await fx.owner.query('SELECT id FROM health_profiles WHERE family_id=$1', [familyId]))
    .rows[0].id as string;
  await fx.owner.query('UPDATE families SET owner_account_id=$1 WHERE id=$2', [accountId, familyId]);
  await fx.owner.query(
    `INSERT INTO measurements(id,family_id,health_profile_id,kind,measured_on,systolic,diastolic,manual_without_source)
     VALUES ($1,$2,$3,'blood_pressure',current_date,120,80,true)`,
    [randomUUID(), familyId, profileId],
  );
  const sessionId = randomUUID();
  await fx.owner.query(
    "INSERT INTO sessions(id,account_id,csrf_token,expires_at) VALUES($1,$2,'csrf',now()+interval '1 day')",
    [sessionId, accountId],
  );
  await fx.owner.query(
    `INSERT INTO push_subscriptions(id,family_id,account_id,last_session_id,endpoint,endpoint_hash,p256dh,auth,authorized_at)
     VALUES($1,$2,$3,$4,'https://push.example/x',$5,'p','a',now())`,
    [randomUUID(), familyId, accountId, sessionId, randomUUID()],
  );
  await fx.owner.query(
    `INSERT INTO removed_member_windows(account_id,family_id,expires_at)
     VALUES($1,$2,now()+interval '168 hours')`,
    [accountId, familyId],
  );
  await fx.owner.query('INSERT INTO object_purges(object_key,family_id) VALUES($1,$2)', [
    `families/${familyId}/profiles/${profileId}/documents/old.jpg`,
    familyId,
  ]);
  const requestId = randomUUID();
  await fx.owner.query(
    `INSERT INTO family_deletion_requests(id,family_id,requested_by,created_at,execute_at)
     VALUES($1,$2,$3,now()-interval '25 hours',$4)`,
    [
      requestId,
      familyId,
      accountId,
      due ? new Date(Date.now() - 3_600_000) : new Date(Date.now() + 3_600_000),
    ],
  );
  objects.add(oldKey);
  objects.add(`families/${familyId}/profiles/${profileId}/documents/${documentId}/previews/p.webp`);
  return { familyId, accountId, profileId, requestId, documentId };
}
