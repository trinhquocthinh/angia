import { randomUUID } from 'node:crypto';
import { sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { findProfileInFamily } from './findProfileInFamily.js';

describe('Đọc đồng thuận dùng chung: cô lập gia đình và giữ loại khóa', () => {
  let t: ProfileTestApp;
  let familyId: string;
  let otherFamilyId: string;
  const profileId = randomUUID();
  beforeAll(async () => {
    t = await startProfileTestApp();
    familyId = await t.family();
    otherFamilyId = await t.family();
    await t.owner.query("INSERT INTO health_profiles(id,family_id,display_name) VALUES($1,$2,'Mẹ')", [
      profileId,
      familyId,
    ]);
  });
  afterAll(async () => {
    await t?.stop();
  });

  it.each([undefined, 'share', 'update'] as const)('đọc đúng đồng thuận với khóa %s', async (lock) => {
    expect(
      await withFamilyScope(t.database, familyId, (tx) => findProfileInFamily(tx, familyId, profileId, lock)),
    ).toEqual({ consentStatus: 'pending' });
  });

  it('trả null khi hồ sơ không tồn tại', async () => {
    expect(
      await withFamilyScope(t.database, familyId, (tx) => findProfileInFamily(tx, familyId, randomUUID())),
    ).toBeNull();
  });

  it('RLS và bộ lọc family_id đều chặn hồ sơ khác gia đình', async () => {
    for (const [scope, filter] of [
      [otherFamilyId, familyId],
      [familyId, otherFamilyId],
    ]) {
      expect(
        await withFamilyScope(t.database, scope!, (tx) => findProfileInFamily(tx, filter!, profileId)),
      ).toBeNull();
    }
  });

  it.each([
    ['SHARE', 'share', false],
    ['SHARE', 'update', true],
    ['UPDATE', 'share', true],
    ['UPDATE', undefined, false],
  ] as const)('khóa %s cạnh tranh với %s: chờ = %s', async (heldLock, lock, blocked) => {
    await t.owner.query('BEGIN');
    try {
      await t.owner.query(`SELECT id FROM health_profiles WHERE id=$1 FOR ${heldLock}`, [profileId]);
      const result = withFamilyScope(t.database, familyId, async (tx) => {
        await tx.execute(sql`SET LOCAL lock_timeout = '200ms'`);
        return findProfileInFamily(tx, familyId, profileId, lock);
      });
      if (blocked) {
        await expect(result).rejects.toMatchObject({ cause: { code: '55P03' } });
      } else {
        expect(await result).toEqual({ consentStatus: 'pending' });
      }
    } finally {
      await t.owner.query('ROLLBACK');
    }
  });
});
