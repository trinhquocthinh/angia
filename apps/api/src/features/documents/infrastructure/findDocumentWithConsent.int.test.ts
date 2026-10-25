import { eq, sql } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { healthProfiles } from '@src/shared/db/schema/index.js';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { findDocumentWithConsent } from './findDocumentWithConsent.js';

describe('TC-390 — đọc chứng từ có khóa tuần tự hóa với rút đồng thuận', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  async function fixture() {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const profile = (await (
      await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Ba' })
    ).json()) as HealthProfile;
    await acceptConsentInvitation(t, main, profile.id);
    const { documentId } = await seedPendingDocument(
      t,
      { familyId, profileId: profile.id, accountId: main.accountId },
      { type: 'device_reading', systolic: 120, diastolic: 80, pulse: null, glucoseValue: null },
    );
    return { familyId, profileId: profile.id, documentId };
  }

  // Giữ khóa hàng hồ sơ như lệnh rút đồng thuận, rồi đọc có khóa với lock_timeout ngắn.
  async function readWhileProfileLocked(lock: boolean) {
    const f = await fixture();
    let release: () => void = () => undefined;
    let ready: () => void = () => undefined;
    const wait = new Promise<void>((resolve) => (release = resolve));
    const acquired = new Promise<void>((resolve) => (ready = resolve));
    const holder = withFamilyScope(t.database, f.familyId, async (tx) => {
      await tx.select().from(healthProfiles).where(eq(healthProfiles.id, f.profileId)).for('update');
      ready();
      await wait;
    });
    await acquired;
    try {
      return await withFamilyScope(t.database, f.familyId, async (tx) => {
        await tx.execute(sql`SET LOCAL lock_timeout = '300ms'`);
        return findDocumentWithConsent(tx, f.familyId, f.documentId, lock);
      }).then(
        (value) => ({ value, error: null as unknown }),
        (error: unknown) => ({ value: null, error }),
      );
    } finally {
      release();
      await holder;
    }
  }

  it('lock = true: chờ khóa hồ sơ (hết hạn chờ khi lệnh rút đang giữ)', async () => {
    const result = await readWhileProfileLocked(true);
    expect(result.value).toBeNull();
    expect(String((result.error as { cause?: { code?: string } })?.cause?.code ?? result.error)).toContain(
      '55P03',
    );
  });

  it('lock = false: đọc không chờ, không khóa hồ sơ', async () => {
    const result = await readWhileProfileLocked(false);
    expect(result.error).toBeNull();
    expect(result.value?.profileConsentStatus).toBe('confirmed');
  });
});
