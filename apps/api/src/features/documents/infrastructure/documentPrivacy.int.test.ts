import { randomUUID } from 'node:crypto';
import { sql, type SQL } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('Ảnh chứng từ: bất biến, không lộ metadata và role app NOBYPASSRLS', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  const scoped = (familyId: string, statement: SQL) =>
    withFamilyScope(t.database, familyId, (tx) => tx.execute(statement));

  const fixture = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const response = await t.call(main, 'POST', '/api/health-profiles', {
      birthYear: 1950,
      displayName: 'Ba',
    });
    const profile = (await response.json()) as HealthProfile;
    await acceptConsentInvitation(t, main, profile.id);
    const { documentId, key } = await seedPendingDocument(
      t,
      {
        familyId,
        profileId: profile.id,
        accountId: main.accountId,
      },
      { type: 'device_reading', systolic: 120, diastolic: 80, pulse: null, glucoseValue: null },
    );
    return { familyId, main, documentId, key };
  };

  it('TC-403: ảnh đã làm sạch bất biến; trạng thái vẫn chuyển được', async () => {
    const f = await fixture();
    for (const change of [sql`image_key = ${`${f.key}.changed`}`, sql`image_sha256 = ${'b'.repeat(64)}`]) {
      await expect(
        scoped(
          f.familyId,
          sql`
        UPDATE source_documents SET ${change} WHERE id = ${f.documentId}
      `,
        ),
      ).rejects.toMatchObject({ cause: { code: '23514' } });
    }
    await expect(
      scoped(
        f.familyId,
        sql`
      UPDATE source_documents SET status = 'manual_entry' WHERE id = ${f.documentId}
    `,
      ),
    ).resolves.toMatchObject({ rowCount: 1 });
  });

  it('TC-120: gia đình khác không đọc/ghi metadata; route review không lộ khóa/hash/người duyệt', async () => {
    const f = await fixture();
    const otherFamily = await t.family();
    const other = await t.session(otherFamily);
    expect(
      (await scoped(otherFamily, sql`SELECT * FROM source_documents WHERE id = ${f.documentId}`)).rows,
    ).toEqual([]);
    expect(
      (
        await scoped(
          otherFamily,
          sql`
      UPDATE source_documents SET status = 'manual_entry' WHERE id = ${f.documentId}
    `,
        )
      ).rowCount,
    ).toBe(0);
    await expectCrossFamilyDenied(
      () => t.call(other, 'GET', `/api/source-documents/${f.documentId}/review`),
      () => t.call(other, 'GET', `/api/source-documents/${randomUUID()}/review`),
    );
    const own = await t.call(f.main, 'GET', `/api/source-documents/${f.documentId}/review`);
    expect(own.status).toBe(200);
    const body = (await own.json()) as { document: Record<string, unknown> };
    for (const field of ['imageKey', 'imageSha256', 'privacyApprovedBy', 'privacyApprovedAt']) {
      expect(body.document).not.toHaveProperty(field);
    }
    expect(JSON.stringify(body)).not.toContain(f.key);
  });
});
