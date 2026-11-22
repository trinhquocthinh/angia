import { randomUUID } from 'node:crypto';
import { strFromU8, unzipSync } from 'fflate';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { seedDataExport } from '@src/shared/test/seedDataExport.test-helper.js';
import { createMemoryExportS3 } from '@src/shared/test/createMemoryExportS3.test-helper.js';
import { buildDataExport } from '../application/buildDataExport.js';
import { createDataExportRepository } from './createDataExportRepository.js';
import { createExportArchive } from './createExportArchive.js';
import { createExportImageReader } from './createExportImageReader.js';

let fixture: Awaited<ReturnType<typeof createSanitizePgFixture>>;
let seed: Awaited<ReturnType<typeof seedDataExport>>;
beforeAll(async () => {
  fixture = await createSanitizePgFixture();
  seed = await seedDataExport(fixture.owner);
});
afterAll(async () => {
  await fixture?.close();
});

async function run(profileId: string | null = null) {
  const exportId = randomUUID();
  await fixture.owner.query(`INSERT INTO data_exports(id,account_id,profile_id) VALUES ($1,$2,$3)`, [
    exportId,
    seed.mother.accountId,
    profileId,
  ]);
  const s3 = createMemoryExportS3();
  for (const profile of [seed.mother, seed.father, seed.child, seed.foreign]) {
    s3.objects.set(profile.key, Buffer.from(profile.marker));
  }
  const deps = {
    repository: createDataExportRepository(fixture.pool),
    archive: createExportArchive(s3.client, 'bucket'),
    images: createExportImageReader(s3.client, 'bucket'),
  };
  const outcome = await buildDataExport(deps, exportId);
  const row = (await fixture.owner.query(`SELECT * FROM data_exports WHERE id=$1`, [exportId])).rows[0];
  const bytes = s3.objects.get(`exports/${exportId}.zip`);
  return { exportId, outcome, row, zip: bytes ? unzipSync(bytes) : {}, s3, deps };
}
function assertOnlyProfile(zip: Record<string, Uint8Array>, target: typeof seed.mother) {
  expect(Object.keys(zip).sort()).toEqual(
    ['account.json', `profile-${target.id}.json`, `images/${target.id}/${target.documentId}.jpg`].sort(),
  );
  const content = Object.values(zip)
    .map((bytes) => strFromU8(bytes))
    .join('\n');
  for (const profile of [seed.mother, seed.father, seed.child, seed.foreign].filter(
    (p) => p.id !== target.id && p.id !== seed.mother.id,
  )) {
    for (const secret of [profile.id, profile.marker, profile.documentId, profile.legalRef])
      expect(content).not.toContain(secret);
  }
  for (const forbidden of ['password_hash', 'argon2id', 'image_key', 'sha256', 'family_id', 'image_sha256']) {
    // account.json giữ family_id theo SPEC-072; dữ liệu hồ sơ loại family_id.
    const text = forbidden === 'family_id' ? strFromU8(zip[`profile-${target.id}.json`]!) : content;
    expect(text).not.toContain(forbidden);
  }
  const profile = JSON.parse(strFromU8(zip[`profile-${target.id}.json`]!));
  expect(profile.health_profiles.id).toBe(target.id);
  expect(profile.prescriptions).toHaveLength(1);
  expect(profile.prescription_items).toHaveLength(1);
  expect(profile.prescription_items[0].name).toBe(target.marker);
  expect(profile.measurements).toHaveLength(1);
  expect(profile.temperature_readings).toHaveLength(1);
  expect(Buffer.from(zip[`images/${target.id}/${target.documentId}.jpg`]!)).toEqual(
    Buffer.from(target.marker),
  );
}
it('TC-819: self chỉ xuất Mẹ, ảnh đã che, ready 24 giờ và chạy lại không ghi thêm', async () => {
  const result = await run();
  expect(result.outcome).toBe('ready');
  assertOnlyProfile(result.zip, seed.mother);
  const account = JSON.parse(strFromU8(result.zip['account.json']!));
  expect(account.id).toBe(seed.mother.accountId);
  expect(account.legal_acceptances).toEqual([
    expect.objectContaining({ kind: 'terms', version: seed.versionId }),
  ]);
  expect(result.row.status).toBe('ready');
  expect(result.row.object_key).toBe(`exports/${result.exportId}.zip`);
  expect(Math.abs(result.row.expires_at.getTime() - Date.now() - 86400000)).toBeLessThan(30000);
  expect(await buildDataExport(result.deps, result.exportId)).toBe('skipped');
  expect(result.s3.state.creates).toBe(1);
  const role = (
    await fixture.pool.query(`SELECT rolsuper,rolbypassrls FROM pg_roles WHERE rolname=current_user`)
  ).rows[0];
  expect(role).toEqual({ rolsuper: false, rolbypassrls: false });
});
it('TC-820: main chỉ xuất hồ sơ Bé không liên kết', async () => {
  const result = await run(seed.child.id);
  expect(result.outcome).toBe('ready');
  assertOnlyProfile(result.zip, seed.child);
  expect(strFromU8(result.zip[`profile-${seed.child.id}.json`]!)).not.toContain(seed.mother.id);
});
it('TC-821: main không xuất hồ sơ Bố liên kết tài khoản khác', async () => {
  const result = await run(seed.father.id);
  expect(result.outcome).toBe('failed');
  expect(result.row.status).toBe('failed');
  expect(result.row.object_key).toBeNull();
  expect(result.s3.state.creates).toBe(0);
});
it('TC-821: không xuất hồ sơ nhà khác', async () => {
  const result = await run(seed.foreign.id);
  expect(result.outcome).toBe('failed');
  expect(result.s3.state.creates).toBe(0);
});
it('TC-822: self xuất được hồ sơ withdrawn', async () => {
  await fixture.owner.query(
    `UPDATE health_profiles SET consent_status='withdrawn',consent_withdrawn_at=now() WHERE id=$1`,
    [seed.mother.id],
  );
  try {
    const result = await run();
    expect(result.outcome).toBe('ready');
    assertOnlyProfile(result.zip, seed.mother);
  } finally {
    await fixture.owner.query(
      `UPDATE health_profiles SET consent_status='pending',consent_withdrawn_at=NULL WHERE id=$1`,
      [seed.mother.id],
    );
  }
});
it('TC-819: self không nhà chỉ có account.json, phạm vi tính lại lúc chạy', async () => {
  await fixture.owner.query(
    `UPDATE accounts SET health_profile_id=NULL,family_id=NULL,family_role=NULL WHERE id=$1`,
    [seed.mother.accountId],
  );
  try {
    const result = await run();
    expect(result.outcome).toBe('ready');
    expect(Object.keys(result.zip)).toEqual(['account.json']);
  } finally {
    await fixture.owner.query(
      `UPDATE accounts SET family_id=$2,family_role='main',health_profile_id=$3 WHERE id=$1`,
      [seed.mother.accountId, seed.familyId, seed.mother.id],
    );
  }
});
