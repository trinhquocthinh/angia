import { randomUUID } from 'node:crypto';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { startAdminTestApp, type AdminTestApp } from '@src/shared/test/startAdminTestApp.js';

const NOW = new Date('2026-10-15T00:00:00Z');
let t: AdminTestApp;
beforeAll(async () => {
  t = await startAdminTestApp({ scanQuotaNow: () => NOW });
});
afterAll(async () => {
  await t?.stop();
});
it('TC-633: worker CP5.4 thật chờ quota cùng Admin cấp thêm đều hoàn tất đúng snapshot', async () => {
  const familyId = await t.seedFamily(),
    profileId = randomUUID(),
    batchId = randomUUID(),
    documentId = randomUUID();
  await t.owner.query("INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,'Tổng hợp')", [
    profileId,
    familyId,
  ]);
  await t.owner.query(
    'INSERT INTO upload_batches(id,family_id,health_profile_id,created_by) VALUES($1,$2,$3,$4)',
    [batchId, familyId, profileId, t.admin.accountId],
  );
  await t.owner.query(
    "INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,status,original_key,mime_type,size_bytes) VALUES($1,$2,$3,$4,'extracting','synthetic','image/png',1)",
    [documentId, familyId, profileId, batchId],
  );
  for (const provider of ['woku', 'openrouter'])
    await t.owner.query(
      `INSERT INTO ai_billing_sources
    (id,provider,credential_fingerprint,status,last_attempt_at,last_complete_at) VALUES($1,$2,$3,'complete',$4,$4)`,
      [randomUUID(), provider, randomUUID(), NOW],
    );
  expect(
    (
      await t.call(t.admin, 'PUT', '/api/admin/scan-quota-policy', {
        month: '2026-10',
        expectedVersion: 0,
        policy: { estimatedCostPerScanUsd: '0.1', reserveBasisPoints: 0, trialScans: 0 },
      })
    ).status,
  ).toBe(200);
  const grant = (total: number, version: number) =>
    t.call(t.admin, 'POST', '/api/admin/scan-quota-grants', {
      month: '2026-10',
      expectedVersion: version,
      grants: [{ familyId, status: 'approved', grantedScans: total, reason: 'Duyệt' }],
    });
  expect((await grant(4, 1)).status).toBe(200);
  await t.owner.query('BEGIN');
  await t.owner.query('SELECT * FROM family_scan_quotas WHERE family_id=$1 FOR UPDATE', [familyId]);
  const root = new URL('../../../../../../', import.meta.url);
  const module = new URL(
    'apps/worker/src/features/extraction/infrastructure/createExtractionRepository.ts',
    root,
  ).href;
  const script = `import pg from 'pg'; import {createExtractionRepository} from ${JSON.stringify(module)};
    const pool=new pg.Pool({connectionString:process.env.CP54_APP_URL});
    try { await createExtractionRepository(pool,()=>new Date('${NOW.toISOString()}')).withFamily('${familyId}',async store=>{
      await store.findDocument('${documentId}'); await store.reserveBudget('${documentId}',{month:'2026-10',estimatedCostUsd:0.02,defaultMonthlyCapUsd:5,defaultFamilyCapUsd:0});
    }); } finally {await pool.end();}`;
  const child = spawn(process.execPath, ['--import', 'tsx', '--input-type=module', '--eval', script], {
    cwd: fileURLToPath(root),
    env: {
      ...process.env,
      TSX_TSCONFIG_PATH: fileURLToPath(new URL('apps/worker/tsconfig.json', root)),
      CP54_APP_URL: t.pool.options.connectionString,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let stderr = '';
  child.stderr.on('data', (chunk) => {
    stderr += String(chunk);
  });
  const exited = once(child, 'exit');
  const blocked = async (query: string) => {
    if (child.exitCode !== null) throw new Error(stderr || `Worker thoát ${child.exitCode}`);
    await t.owner.query('SELECT pg_stat_clear_snapshot()');
    return (await t.owner.query(query)).rows[0].n;
  };
  let api: Promise<Response> | undefined;
  try {
    await expect
      .poll(
        () =>
          blocked(`SELECT count(*)::int AS n FROM pg_stat_activity
      WHERE query LIKE 'SELECT month FROM family_scan_quotas%' AND wait_event_type='Lock'`),
        { timeout: 10000 },
      )
      .toBe(1);
    const pendingGrant = Promise.resolve(grant(5, 2));
    api = pendingGrant;
    await expect
      .poll(
        () =>
          blocked(`SELECT count(*)::int AS n FROM pg_stat_activity
      WHERE query LIKE 'SELECT id FROM scan_quota_policy WHERE id = 1 FOR UPDATE%' AND wait_event_type='Lock'`),
        { timeout: 10000 },
      )
      .toBe(1);
    await t.owner.query('COMMIT');
    const [response, exit] = await Promise.all([pendingGrant, exited]);
    expect(exit, stderr).toEqual([0, null]);
    expect(response.status).toBe(200);
    expect(
      (
        await t.owner.query(
          'SELECT granted_scans::int AS granted,held_scans::int AS held FROM family_scan_quotas WHERE family_id=$1',
          [familyId],
        )
      ).rows[0],
    ).toEqual({ granted: 5, held: 1 });
    expect(
      (await t.owner.query('SELECT committed_remaining_scans::text AS committed FROM scan_quota_months'))
        .rows[0].committed,
    ).toBe('5');
  } finally {
    await t.owner.query('ROLLBACK');
    if (child.exitCode === null) child.kill();
    await Promise.allSettled([api, exited]);
  }
});
