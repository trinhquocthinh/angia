import { randomUUID } from 'node:crypto';
import { strFromU8, unzipSync } from 'fflate';
import { afterAll, beforeAll, beforeEach, expect, it } from 'vitest';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { seedDataExportWindow } from '@src/shared/test/seedDataExportWindow.test-helper.js';
import { createMemoryExportS3 } from '@src/shared/test/createMemoryExportS3.test-helper.js';
import { buildDataExport } from '../application/buildDataExport.js';
import { createDataExportRepository } from './createDataExportRepository.js';
import { createExportArchive } from './createExportArchive.js';
import { createExportImageReader } from './createExportImageReader.js';

let fixture: Awaited<ReturnType<typeof createSanitizePgFixture>>;
let seed: Awaited<ReturnType<typeof seedDataExportWindow>>;
beforeAll(async () => {
  fixture = await createSanitizePgFixture();
  seed = await seedDataExportWindow(fixture.owner);
});
afterAll(async () => {
  await fixture?.close();
});
beforeEach(async () => {
  await fixture.owner.query('DELETE FROM removed_member_windows');
  await fixture.owner.query(
    `UPDATE accounts SET family_id=NULL,family_role=NULL,health_profile_id=NULL WHERE id=$1`,
    [seed.mother.accountId],
  );
});
async function addWindow(days: number) {
  await fixture.owner.query(
    `INSERT INTO removed_member_windows(account_id,family_id,health_profile_id,removed_at,expires_at)
     VALUES ($1,$2,$3,now()-$4::interval,now()-$4::interval+interval '168 hours')`,
    [seed.mother.accountId, seed.familyId, seed.mother.id, `${days} days`],
  );
}
async function joinNewFamily() {
  await fixture.owner.query(
    `UPDATE accounts SET family_id=$2,family_role='main',health_profile_id=$3 WHERE id=$1`,
    [seed.mother.accountId, seed.otherFamilyId, seed.foreign.id],
  );
}
async function run(profileId: string | null = null) {
  const exportId = randomUUID();
  await fixture.owner.query('INSERT INTO data_exports(id,account_id,profile_id) VALUES ($1,$2,$3)', [
    exportId,
    seed.mother.accountId,
    profileId,
  ]);
  const s3 = createMemoryExportS3();
  for (const profile of [seed.mother, seed.father, seed.child, seed.foreign])
    s3.objects.set(profile.key, Buffer.from(profile.marker));
  const outcome = await buildDataExport(
    {
      repository: createDataExportRepository(fixture.pool),
      archive: createExportArchive(s3.client, 'bucket'),
      images: createExportImageReader(s3.client, 'bucket'),
    },
    exportId,
  );
  expect(outcome).toBe('ready');
  const row = (await fixture.owner.query('SELECT status FROM data_exports WHERE id=$1', [exportId])).rows[0];
  expect(row.status).toBe('ready');
  return unzipSync(s3.objects.get(`exports/${exportId}.zip`)!);
}
function profileFiles(profile: typeof seed.mother) {
  return [`profile-${profile.id}.json`, `images/${profile.id}/${profile.documentId}.jpg`];
}
it('TC-823: bị gỡ 3 ngày, không nhà, vẫn có hồ sơ withdrawn, ảnh và ba bảng đồng thuận', async () => {
  await addWindow(3);
  const zip = await run();
  expect(Object.keys(zip).sort()).toEqual(['account.json', ...profileFiles(seed.mother)].sort());
  const text = strFromU8(zip[`profile-${seed.mother.id}.json`]!);
  const profile = JSON.parse(text);
  expect(profile.health_profiles.consent_status).toBe('withdrawn');
  expect(profile.measurements).toHaveLength(1);
  expect(profile.prescription_items[0].name).toBe(seed.mother.marker);
  expect(profile.consent_invitations).toEqual([
    expect.objectContaining({ respondent_name: seed.mother.marker }),
  ]);
  expect(profile.consent_legacy_attestations).toEqual([
    expect.objectContaining({ profile_id: seed.mother.id, basis: 'self' }),
  ]);
  expect(profile.profile_link_events).toEqual([
    expect.objectContaining({ action: 'unlink', actor_role: 'owner' }),
  ]);
  expect(Buffer.from(zip[`images/${seed.mother.id}/${seed.mother.documentId}.jpg`]!)).toEqual(
    Buffer.from(seed.mother.marker),
  );
  for (const forbidden of [
    'token_hash',
    'invited_by_account_id',
    'confirmed_by_account_id',
    'actor_account_id',
    'from_account_id',
    'to_account_id',
    seed.father.id,
    seed.father.marker,
    seed.child.id,
  ])
    expect(text).not.toContain(forbidden);
});
it('TC-824: bị gỡ 8 ngày chỉ còn account.json', async () => {
  await addWindow(8);
  expect(Object.keys(await run())).toEqual(['account.json']);
});
it('TC-823: vào nhà mới, còn cửa sổ cũ, ZIP có cả hai hồ sơ và ảnh đúng nhà', async () => {
  await addWindow(3);
  await joinNewFamily();
  expect(Object.keys(await run()).sort()).toEqual(
    ['account.json', ...profileFiles(seed.mother), ...profileFiles(seed.foreign)].sort(),
  );
});
it('TC-823: scope profileId không xuất cửa sổ hồ sơ cũ', async () => {
  await addWindow(3);
  await joinNewFamily();
  const zip = await run(seed.foreign.id);
  expect(Object.keys(zip).sort()).toEqual(['account.json', ...profileFiles(seed.foreign)].sort());
  expect(strFromU8(zip[`profile-${seed.foreign.id}.json`]!)).not.toContain(seed.mother.id);
});
