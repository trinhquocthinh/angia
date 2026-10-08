import { randomUUID } from 'node:crypto';
import { sql, type SQL } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { withFamilyScope } from '@src/shared/db/withFamilyScope.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('Dữ liệu xác nhận riêng tư: migration thật và role app NOBYPASSRLS', () => {
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
    const response = await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Ba' });
    const profile = (await response.json()) as HealthProfile;
    const { documentId, key } = await seedPendingDocument(
      t,
      {
        familyId,
        profileId: profile.id,
        accountId: main.accountId,
      },
      { type: 'device_reading', systolic: 120, diastolic: 80, pulse: null, glucoseValue: null },
    );
    return { familyId, main, documentId, originalKey: key, ocrKey: `${key}.ocr.${randomUUID()}.jpg` };
  };

  it('TC-117: cho phép awaiting_privacy; chứng từ cũ có metadata riêng tư null', async () => {
    const f = await fixture();
    await expect(
      scoped(
        f.familyId,
        sql`
      UPDATE source_documents SET status = 'awaiting_privacy' WHERE id = ${f.documentId}
    `,
      ),
    ).resolves.toMatchObject({ rowCount: 1 });
    const result = await scoped(
      f.familyId,
      sql`
      SELECT ocr_image_key, ocr_image_sha256, privacy_approved_by, privacy_approved_at
      FROM source_documents WHERE id = ${f.documentId}
    `,
    );
    expect(result.rows).toEqual([
      {
        ocr_image_key: null,
        ocr_image_sha256: null,
        privacy_approved_by: null,
        privacy_approved_at: null,
      },
    ]);
  });

  it('TC-118: từ chối khóa/hash thiếu, hash sai định dạng hoặc ảnh gốc làm bản OCR', async () => {
    const f = await fixture();
    for (const change of [
      sql`ocr_image_key = ${f.ocrKey}`,
      sql`ocr_image_sha256 = ${'a'.repeat(64)}`,
      sql`ocr_image_key = ${f.ocrKey}, ocr_image_sha256 = 'bad'`,
      sql`ocr_image_key = ' ', ocr_image_sha256 = ${'a'.repeat(64)}`,
      sql`ocr_image_key = ${f.originalKey}, ocr_image_sha256 = ${'a'.repeat(64)}`,
    ]) {
      await expect(
        scoped(
          f.familyId,
          sql`
        UPDATE source_documents SET ${change} WHERE id = ${f.documentId}
      `,
        ),
      ).rejects.toMatchObject({ cause: { code: '23514' } });
    }
  });

  it('TC-118: xác nhận phải đủ người/thời điểm/bản ảnh, thời điểm phải hữu hạn', async () => {
    const f = await fixture();
    for (const change of [
      sql`privacy_approved_by = ${f.main.accountId}`,
      sql`privacy_approved_at = '2026-10-08T03:00:00Z'`,
      sql`privacy_approved_by = ${f.main.accountId}, privacy_approved_at = '2026-10-08T03:00:00Z'`,
    ]) {
      await expect(
        scoped(
          f.familyId,
          sql`
        UPDATE source_documents SET ${change} WHERE id = ${f.documentId}
      `,
        ),
      ).rejects.toMatchObject({ cause: { code: '23514' } });
    }
    await scoped(
      f.familyId,
      sql`
      UPDATE source_documents SET ocr_image_key = ${f.ocrKey}, ocr_image_sha256 = ${'a'.repeat(64)}
      WHERE id = ${f.documentId}
    `,
    );
    await expect(
      scoped(
        f.familyId,
        sql`
      UPDATE source_documents SET privacy_approved_by = ${f.main.accountId}, privacy_approved_at = 'infinity'
      WHERE id = ${f.documentId}
    `,
      ),
    ).rejects.toMatchObject({ cause: { code: '23514' } });
    await expect(
      scoped(
        f.familyId,
        sql`
      UPDATE source_documents SET privacy_approved_by = ${randomUUID()}, privacy_approved_at = '2026-10-08T03:00:00Z'
      WHERE id = ${f.documentId}
    `,
      ),
    ).rejects.toMatchObject({ cause: { code: '23503' } });
  });

  it('TC-119: bản chưa duyệt được thay; bản đã duyệt bất biến, trạng thái vẫn chuyển được', async () => {
    const f = await fixture();
    await scoped(
      f.familyId,
      sql`
      UPDATE source_documents SET ocr_image_key = ${f.ocrKey}, ocr_image_sha256 = ${'a'.repeat(64)}
      WHERE id = ${f.documentId}
    `,
    );
    await scoped(
      f.familyId,
      sql`
      UPDATE source_documents SET ocr_image_sha256 = ${'b'.repeat(64)} WHERE id = ${f.documentId}
    `,
    );
    await scoped(
      f.familyId,
      sql`
      UPDATE source_documents SET privacy_approved_by = ${f.main.accountId}, privacy_approved_at = '2026-10-08T03:00:00Z'
      WHERE id = ${f.documentId}
    `,
    );
    for (const change of [
      sql`ocr_image_key = ${`${f.ocrKey}.changed`}`,
      sql`ocr_image_sha256 = ${'c'.repeat(64)}`,
      sql`privacy_approved_by = NULL, privacy_approved_at = NULL`,
      sql`privacy_approved_at = '2026-10-09T03:00:00Z'`,
      sql`original_key = ${`${f.originalKey}.changed`}`,
    ]) {
      await expect(
        scoped(
          f.familyId,
          sql`
        UPDATE source_documents SET ${change} WHERE id = ${f.documentId}
      `,
        ),
      ).rejects.toMatchObject({ cause: { code: '23514', constraint: 'source_documents_privacy_immutable' } });
    }
    await expect(
      scoped(
        f.familyId,
        sql`
      UPDATE source_documents SET status = 'rejected' WHERE id = ${f.documentId}
    `,
      ),
    ).resolves.toMatchObject({ rowCount: 1 });
  });

  it('TC-120: gia đình khác không đọc/ghi metadata; route review không lộ khóa/hash/người duyệt', async () => {
    const f = await fixture();
    await scoped(
      f.familyId,
      sql`
      UPDATE source_documents SET ocr_image_key = ${f.ocrKey}, ocr_image_sha256 = ${'a'.repeat(64)},
      privacy_approved_by = ${f.main.accountId}, privacy_approved_at = '2026-10-08T03:00:00Z'
      WHERE id = ${f.documentId}
    `,
    );
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
    for (const field of [
      'originalKey',
      'previewKey',
      'ocrImageKey',
      'ocrImageSha256',
      'privacyApprovedBy',
      'privacyApprovedAt',
    ]) {
      expect(body.document).not.toHaveProperty(field);
    }
    expect(JSON.stringify(body)).not.toContain(f.ocrKey);
  });
});
