import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DocumentEntry, DocumentEntryPage, HealthProfile } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { vietnamDate } from '@src/shared/test/createFiniteCourse.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const lab = (resultDate: string, names: string[]) => ({
  type: 'lab_result',
  resultDate,
  facility: 'BV Gia Định',
  items: names.map((testName) => ({ testName, value: '7,2', unit: '%', referenceRange: null })),
});
const prescription = {
  type: 'prescription',
  issuedDate: '2026-10-05',
  facility: null,
  diagnosis: null,
  items: [
    {
      name: 'Amlodipin',
      strength: '5mg',
      quantityPerDose: 1,
      doseUnit: 'viên',
      slots: ['morning'],
      durationDays: 30,
      longTerm: false,
      note: null,
      totalQuantity: null,
    },
  ],
};
const reading = {
  type: 'device_reading',
  measuredAt: '2026-10-06',
  measuredTime: '07:10',
  kind: 'blood_pressure',
  systolic: 130,
  diastolic: 90,
  pulse: 78,
  glucoseValue: null,
  glucoseUnit: null,
};

describe('API danh mục chứng từ của hồ sơ + RLS (SPEC-028)', () => {
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
      await t.call(main, 'POST', '/api/health-profiles', { birthYear: 1950, displayName: 'Mẹ' })
    ).json()) as HealthProfile;
    await acceptConsentInvitation(t, main, profile.id);
    const owner = { familyId, profileId: profile.id, accountId: main.accountId };
    const manual = (type: string, data: object) =>
      t.call(main, 'POST', `/api/health-profiles/${profile.id}/manual-records`, { type, data });
    const list = async (query = '') => {
      const response = await t.call(
        main,
        'GET',
        `/api/health-profiles/${profile.id}/document-entries${query}`,
      );
      return { response, body: (await response.json()) as DocumentEntryPage };
    };
    return { familyId, main, profile, owner, manual, list };
  }

  it('TC-270, TC-272: thứ tự theo ngày mục, kèm bản ghi đã lưu; phiếu nhập tay gom theo lần lưu; không có số đo nhập tay', async () => {
    const f = await fixture();
    const approved = await seedPendingDocument(
      t,
      f.owner,
      lab('2026-10-01', ['HbA1c', 'Glucose', 'Creatinin']),
    );
    const data = lab('2026-10-01', ['HbA1c', 'Glucose', 'Creatinin']);
    expect(
      (
        await t.call(f.main, 'POST', `/api/source-documents/${approved.documentId}/approve`, {
          type: 'lab_result',
          data,
        })
      ).status,
    ).toBe(200);
    expect((await f.manual('prescription', prescription)).status).toBe(200);
    expect((await f.manual('device_reading', reading)).status).toBe(200);
    expect((await f.manual('lab_result', lab('2026-10-03', ['HbA1c', 'Glucose', 'LDL']))).status).toBe(200);
    expect((await f.manual('lab_result', lab('2026-10-03', ['TSH']))).status).toBe(200);
    const manualEntry = await seedPendingDocument(t, f.owner, lab('2026-09-20', ['HbA1c']));
    await t.owner.query(
      "UPDATE source_documents SET status='manual_entry', document_date='2026-09-20' WHERE id=$1",
      [manualEntry.documentId],
    );
    const pending = await seedPendingDocument(t, f.owner, lab('2026-10-10', ['HbA1c']));
    const { response, body } = await f.list();
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(body.nextCursor).toBeNull();
    const summary = (e: DocumentEntry) => [e.origin, e.type, e.status, e.entryDate, e.dateKnown];
    expect(body.items.map(summary)).toEqual([
      ['document', 'lab_result', 'pending_review', vietnamDate(0), false],
      ['manual', 'prescription', 'manual_record', '2026-10-05', true],
      ['manual', 'lab_result', 'manual_record', '2026-10-03', true],
      ['manual', 'lab_result', 'manual_record', '2026-10-03', true],
      ['document', 'lab_result', 'approved', '2026-10-01', true],
      ['document', 'lab_result', 'manual_entry', '2026-09-20', true],
    ]);
    const [first, manualRx, labTsh, labTriple, approvedEntry, manualEntryEntry] = body.items;
    expect(first).toMatchObject({
      id: pending.documentId,
      records: { prescription: null, labResults: [], measurements: [] },
    });
    expect(manualRx!.records.prescription).toMatchObject({
      id: manualRx!.id,
      items: [{ name: 'Amlodipin' }],
    });
    expect(labTsh!.records.labResults.map((r) => r.testName)).toEqual(['TSH']);
    expect(labTriple!.records.labResults.map((r) => r.testName)).toEqual(['HbA1c', 'Glucose', 'LDL']);
    expect(approvedEntry).toMatchObject({ id: approved.documentId, hasImage: true });
    expect(approvedEntry!.records.labResults).toHaveLength(3);
    expect(manualEntryEntry!.records).toEqual({ prescription: null, labResults: [], measurements: [] });
    expect(JSON.stringify(body)).not.toMatch(/Cần chú ý|Bình thường|bất thường/);
  });

  it('TC-273: lọc theo loại gồm cả bản nhập tay; chưa phân loại chỉ có khi không lọc; loại sai → 422', async () => {
    const f = await fixture();
    expect((await f.manual('prescription', prescription)).status).toBe(200);
    const reading = await seedPendingDocument(t, f.owner, { type: 'device_reading' });
    const unknown = await seedPendingDocument(t, f.owner, { type: 'device_reading' });
    await t.owner.query('UPDATE source_documents SET type=NULL WHERE id=$1', [unknown.documentId]);
    expect((await f.list()).body.items).toHaveLength(3);
    expect((await f.list('?type=prescription')).body.items.map((e) => e.origin)).toEqual(['manual']);
    expect((await f.list('?type=device_reading')).body.items.map((e) => e.id)).toEqual([reading.documentId]);
    expect((await f.list('?type=lab_result')).body.items).toEqual([]);
    expect((await f.list('?type=xray')).response.status).toBe(422);
  });

  it('TC-271: 25 mục cùng ngày và cùng thời điểm lưu → hai trang đủ, không trùng; limit và cursor sai → 422', async () => {
    const f = await fixture();
    const batchId = randomUUID();
    await t.owner.query(
      'INSERT INTO upload_batches(id,family_id,health_profile_id,created_by) VALUES ($1,$2,$3,$4)',
      [batchId, f.familyId, f.profile.id, f.main.accountId],
    );
    await t.owner.query(
      `INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,type,status,document_date,image_key,image_sha256,mime_type,size_bytes,created_at)
       SELECT gen_random_uuid(), $1, $2, $3, 'lab_result', 'pending_review', '2026-10-01', 'k/' || g, repeat('a', 64), 'image/jpeg', 1,
         '2026-10-13T01:02:03.456789Z'
       FROM generate_series(1, 25) g`,
      [f.familyId, f.profile.id, batchId],
    );
    const first = await f.list('?limit=20');
    expect(first.body.items).toHaveLength(20);
    const second = await f.list(`?limit=20&cursor=${first.body.nextCursor}`);
    expect(second.body.items).toHaveLength(5);
    expect(second.body.nextCursor).toBeNull();
    const ids = [...first.body.items, ...second.body.items].map((e) => e.id);
    expect(new Set(ids).size).toBe(25);
    expect((await f.list('?limit=0')).response.status).toBe(422);
    expect((await f.list('?limit=51')).response.status).toBe(422);
    expect((await f.list('?cursor=h%E1%BB%8Fng')).response.status).toBe(422);
    // Mục cuối trang đã bị xóa: keyset theo giá trị nên trang kế vẫn đúng.
    await t.owner.query('DELETE FROM source_documents WHERE id=$1', [first.body.items[19]!.id]);
    expect((await f.list(`?limit=20&cursor=${first.body.nextCursor}`)).body.items.map((e) => e.id)).toEqual(
      second.body.items.map((e) => e.id),
    );
  });

  it('TC-274: hồ sơ gia đình khác như không tồn tại; member 403', async () => {
    const f = await fixture();
    const other = await t.session(await t.family());
    await expectCrossFamilyDenied(
      () => t.call(other, 'GET', `/api/health-profiles/${f.profile.id}/document-entries`),
      () => t.call(other, 'GET', `/api/health-profiles/${randomUUID()}/document-entries`),
    );
    const member = await t.session(f.familyId, 'member', 'Thành viên');
    expect(
      (await t.call(member, 'GET', `/api/health-profiles/${f.profile.id}/document-entries`)).status,
    ).toBe(403);
  });

  it('TC-409: ảnh còn có hasImage true; bản nhập tay luôn false', async () => {
    const f = await fixture();
    const image = await seedPendingDocument(t, f.owner, { type: 'device_reading' });
    expect((await f.manual('prescription', prescription)).status).toBe(200);
    const { body } = await f.list();
    expect(body.items.find((e) => e.id === image.documentId)).toMatchObject({ hasImage: true });
    expect(body.items.find((e) => e.origin === 'manual')).toMatchObject({ hasImage: false });
    expect(JSON.stringify(body)).not.toContain('hasOcrImage');
  });
});
