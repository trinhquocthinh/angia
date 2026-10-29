import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile } from '@angia/contracts';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const item = {
  name: 'AMLODIPIN',
  strength: '10mg',
  quantityPerDose: 1,
  doseUnit: 'viên',
  slots: ['evening'],
  durationDays: 30,
  longTerm: false,
  note: null,
  totalQuantity: null,
};
const data = {
  type: 'prescription',
  issuedDate: '2026-10-01',
  facility: null,
  diagnosis: null,
  items: [item],
};

describe('API xử lý xung đột đợt thuốc (SPEC-015)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  async function fixture(startDate = '2026-09-01', count = 1) {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const response = await t.call(main, 'POST', '/api/health-profiles', {
      birthYear: 1950,
      displayName: 'Mẹ',
    });
    const profile = (await response.json()) as HealthProfile;
    await acceptConsentInvitation(t, main, profile.id);
    const oldIds: string[] = [];
    for (let n = 0; n < count; n++) {
      const id = randomUUID();
      oldIds.push(id);
      await t.owner.query(
        `INSERT INTO medication_courses
        (id, family_id, health_profile_id, source, name, name_normalized, quantity_per_dose, dose_unit, slots, start_date, status)
        VALUES ($1, $2, $3, 'self_reported', 'Amlodipin', 'amlodipin', 1, 'viên', ARRAY['morning'], $4, 'active')`,
        [id, familyId, profile.id, startDate],
      );
    }
    const { documentId } = await seedPendingDocument(
      t,
      { familyId, profileId: profile.id, accountId: main.accountId },
      data,
    );
    const payload = (resolution?: 'replace' | 'parallel', ids = oldIds) => ({
      type: 'prescription',
      data: {
        ...data,
        items: [{ ...item, ...(resolution ? { resolution, expectedConflictCourseIds: ids } : {}) }],
      },
    });
    const approve = (body: object = payload()) =>
      t.call(main, 'POST', `/api/source-documents/${documentId}/approve`, body);
    return { familyId, main, profileId: profile.id, documentId, oldIds, payload, approve };
  }
  const courses = async (profileId: string) =>
    (
      await t.owner.query(
        `SELECT id, status, start_date::text, end_date::text FROM medication_courses WHERE health_profile_id = $1 ORDER BY id`,
        [profileId],
      )
    ).rows;

  it('TC-046: 409 liệt kê đủ đợt xung đột và không ghi đơn', async () => {
    const f = await fixture('2026-09-01', 2);
    const response = await f.approve();
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      error: {
        code: 'ERR_COURSE_CONFLICT_UNRESOLVED',
        details: {
          conflicts: [
            {
              itemIndexes: [0],
              nameNormalized: 'amlodipin',
              courses: expect.arrayContaining(
                f.oldIds.map((id) => expect.objectContaining({ id, startDate: '2026-09-01', endDate: null })),
              ),
            },
          ],
        },
      },
    });
    expect(
      (await t.owner.query('SELECT id FROM prescriptions WHERE source_document_id = $1', [f.documentId]))
        .rows,
    ).toEqual([]);
    expect(
      (await t.owner.query('SELECT status FROM source_documents WHERE id = $1', [f.documentId])).rows[0]
        .status,
    ).toBe('pending_review');
  });
  it('TC-047: thay tất cả đợt cũ trong cùng transaction', async () => {
    const f = await fixture('2026-09-01', 2);
    expect((await f.approve(f.payload('replace'))).status).toBe(200);
    const rows = await courses(f.profileId);
    expect(rows.filter((c) => f.oldIds.includes(c.id))).toEqual(
      expect.arrayContaining(
        f.oldIds.map((id) => ({
          id,
          status: 'replaced',
          start_date: '2026-09-01',
          end_date: '2026-09-30',
        })),
      ),
    );
    expect(rows.filter((c) => c.status === 'active')).toHaveLength(1);
  });
  it('TC-048: song song giữ nguyên các đợt cũ', async () => {
    const f = await fixture();
    expect((await f.approve(f.payload('parallel'))).status).toBe(200);
    expect(await courses(f.profileId)).toEqual(
      expect.arrayContaining([
        {
          id: f.oldIds[0],
          status: 'active',
          start_date: '2026-09-01',
          end_date: null,
        },
      ]),
    );
    expect(await courses(f.profileId)).toHaveLength(2);
  });
  it('thay thế cùng ngày được CHECK mới cho phép', async () => {
    const f = await fixture('2026-10-01');
    expect((await f.approve(f.payload('replace'))).status).toBe(200);
    expect(await courses(f.profileId)).toEqual(
      expect.arrayContaining([
        {
          id: f.oldIds[0],
          status: 'replaced',
          start_date: '2026-10-01',
          end_date: '2026-09-30',
        },
      ]),
    );
  });
  it('xung đột đổi sau khi UI đọc: 409 và không đóng đợt chưa được xác nhận', async () => {
    const f = await fixture('2026-09-01', 2);
    expect((await f.approve(f.payload('replace', [f.oldIds[0]!]))).status).toBe(409);
    expect((await courses(f.profileId)).every((c) => c.status === 'active')).toBe(true);
  });
  it('lỗi ghi đợt mới rollback cả đợt cũ đã thay thế', async () => {
    const f = await fixture();
    await t.owner.query(
      `ALTER TABLE medication_courses ADD CONSTRAINT test_conflict_failure CHECK (name <> 'AMLODIPIN') NOT VALID`,
    );
    try {
      expect((await f.approve(f.payload('replace'))).status).toBe(500);
      expect(await courses(f.profileId)).toEqual([
        {
          id: f.oldIds[0],
          status: 'active',
          start_date: '2026-09-01',
          end_date: null,
        },
      ]);
      expect(
        (await t.owner.query('SELECT id FROM prescriptions WHERE source_document_id = $1', [f.documentId]))
          .rows,
      ).toEqual([]);
    } finally {
      await t.owner.query('ALTER TABLE medication_courses DROP CONSTRAINT test_conflict_failure');
    }
  });
  it('hai chứng từ cùng hồ sơ, đồng thời khi chưa có đợt: một lưu, một báo xung đột', async () => {
    const f = await fixture('2026-09-01', 0);
    const other = await seedPendingDocument(
      t,
      { familyId: f.familyId, profileId: f.profileId, accountId: f.main.accountId },
      data,
    );
    const responses = await Promise.all([
      f.approve({ ...f.payload(), confirmDuplicate: true }),
      t.call(f.main, 'POST', `/api/source-documents/${other.documentId}/approve`, {
        ...f.payload(),
        confirmDuplicate: true,
      }),
    ]);
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await courses(f.profileId)).toHaveLength(1);
  });
  it('hai lệnh nhập trực tiếp đồng thời không deadlock khi đã khóa SHARE hồ sơ', async () => {
    const f = await fixture('2026-09-01', 0);
    const responses = await Promise.all(
      [0, 1].map(() =>
        t.call(f.main, 'POST', `/api/health-profiles/${f.profileId}/manual-records`, {
          ...f.payload(),
          confirmDuplicate: true,
        }),
      ),
    );
    expect(responses.map((r) => r.status).sort()).toEqual([200, 409]);
    expect(await courses(f.profileId)).toHaveLength(1);
  });
  it('gia đình khác không đọc/đóng được đợt qua cả hai route', async () => {
    const f = await fixture();
    const other = await t.session(await t.family());
    const payload = f.payload('replace');
    await expectCrossFamilyDenied(
      () => t.call(other, 'POST', `/api/source-documents/${f.documentId}/approve`, payload),
      () => t.call(other, 'POST', `/api/source-documents/${randomUUID()}/approve`, payload),
    );
    await expectCrossFamilyDenied(
      () => t.call(other, 'POST', `/api/health-profiles/${f.profileId}/manual-records`, payload),
      () => t.call(other, 'POST', `/api/health-profiles/${randomUUID()}/manual-records`, payload),
    );
    expect((await courses(f.profileId))[0].status).toBe('active');
  });
});
