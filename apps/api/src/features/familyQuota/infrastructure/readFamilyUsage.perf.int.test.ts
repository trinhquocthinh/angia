import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { vietnamDayBounds } from '../domain/vietnamDayBounds.js';
import { lockFamilyQuota } from './lockFamilyQuota.js';
import { readFamilyUsage } from './readFamilyUsage.js';

const DOCUMENTS = 1000;
const RUNS = 20;

describe('Đo truy vấn mức dùng gia đình với 1.000 chứng từ (SPEC-030, Tech Spec §3 F03b)', () => {
  let t: ProfileTestApp;
  let familyId: string;
  beforeAll(async () => {
    t = await startProfileTestApp();
    familyId = await t.family();
    const main = await t.session(familyId);
    const created = await t.call(main, 'POST', '/api/health-profiles', {
      birthYear: 1950,
      displayName: 'Bà',
    });
    const profileId = ((await created.json()) as HealthProfile).id;
    const batch = await t.owner.query(
      'INSERT INTO upload_batches(id,family_id,health_profile_id,created_by) VALUES (gen_random_uuid(),$1,$2,$3) RETURNING id',
      [familyId, profileId, main.accountId],
    );
    await t.owner.query(
      `INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,status,original_key,mime_type,size_bytes,created_at)
       SELECT gen_random_uuid(), $1::uuid, $2::uuid, $3::uuid,
              (ARRAY['uploaded','rejected','pending_review','manual_entry'])[1 + i % 4],
              'families/' || $1::text || '/k/' || i, 'image/jpeg', 3000000, now() - (i || ' seconds')::interval
       FROM generate_series(1, ${DOCUMENTS}) AS i`,
      [familyId, profileId, batch.rows[0].id],
    );
    await t.owner.query('ANALYZE source_documents');
  });
  afterAll(async () => t?.stop());

  it('trung vị khóa + đếm < 20 ms', async () => {
    const dayStart = vietnamDayBounds(new Date()).start;
    const timings: number[] = [];
    let usage = { storageBytes: 0, uploadsToday: 0, pendingJobs: 0 };
    for (let i = 0; i < RUNS; i += 1) {
      const started = performance.now();
      usage = await withFamilyScope(t.database, familyId, async (tx) => {
        await lockFamilyQuota(tx, familyId);
        return readFamilyUsage(tx, familyId, dayStart);
      });
      timings.push(performance.now() - started);
    }
    timings.sort((a, b) => a - b);
    const median = timings[RUNS / 2]!;
    console.info(
      `[F03b] readFamilyUsage ${DOCUMENTS} chứng từ: trung vị ${median.toFixed(2)} ms, max ${timings.at(-1)!.toFixed(2)} ms`,
    );
    expect(usage.storageBytes).toBe(DOCUMENTS * 3000000);
    expect(usage.pendingJobs).toBe(DOCUMENTS / 4);
    expect(median).toBeLessThan(20);
  });
});
