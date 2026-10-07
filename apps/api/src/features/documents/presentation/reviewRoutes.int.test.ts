import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ApprovedDocumentResponse, DocumentReview, HealthProfile, Measurement } from '@angia/contracts';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const reading = {
  type: 'device_reading',
  measuredAt: '2026-10-05',
  measuredTime: '07:10',
  kind: 'blood_pressure',
  systolic: 1300,
  diastolic: 90,
  pulse: 78,
  glucoseValue: null,
  glucoseUnit: null,
} as const;
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3]);

describe('Duyệt số đo từ ảnh máy đo: route thật, transaction và RLS (E2-S6-T1)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  // Chứng từ đã qua worker: pending_review + bản trích xuất + ảnh gốc trong S3 giả.
  const pendingFixture = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const created = await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Ba' });
    const profile = (await created.json()) as HealthProfile;
    const batchId = randomUUID();
    const documentId = randomUUID();
    const key = `families/${familyId}/profiles/${profile.id}/documents/${documentId}/original.jpg`;
    await t.owner.query(
      'INSERT INTO upload_batches(id,family_id,health_profile_id,created_by) VALUES ($1,$2,$3,$4)',
      [batchId, familyId, profile.id, main.accountId],
    );
    await t.owner.query(
      `INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,type,status,original_key,mime_type,size_bytes)
       VALUES ($1,$2,$3,$4,'device_reading','pending_review',$5,'image/jpeg',$6)`,
      [documentId, familyId, profile.id, batchId, key, JPEG.length],
    );
    await t.owner.query(
      `INSERT INTO extractions(id,family_id,source_document_id,provider,model,payload,cost_usd)
       VALUES ($1,$2,$3,'fake','fake',$4,0)`,
      [randomUUID(), familyId, documentId, reading],
    );
    t.objects.set(key, { body: JPEG, contentType: 'image/jpeg' });
    return { familyId, main, profile, documentId, key };
  };
  const approve = (user: SeededSession, id: string, data: object = {}, confirmOutOfRange?: boolean) =>
    t.call(user, 'POST', `/api/source-documents/${id}/approve`, {
      type: 'device_reading',
      data: { ...reading, ...data },
      ...(confirmOutOfRange === undefined ? {} : { confirmOutOfRange }),
    });
  const measurementsOf = async (user: SeededSession, profileId: string) =>
    (await (
      await t.call(user, 'GET', `/api/health-profiles/${profileId}/measurements`)
    ).json()) as Measurement[];

  it('hàng đợi chỉ gồm chứng từ pending_review của gia đình; trả bản trích xuất và ảnh gốc', async () => {
    const { main, documentId } = await pendingFixture();
    const other = await pendingFixture();
    const queue = await t.call(main, 'GET', '/api/source-documents?status=pending_review');
    expect(queue.headers.get('cache-control')).toBe('no-store');
    const ids = ((await queue.json()) as { id: string }[]).map((d) => d.id);
    expect(ids).toEqual([documentId]);
    expect(ids).not.toContain(other.documentId);
    await t.owner.query("UPDATE source_documents SET status='extracting' WHERE id=$1", [other.documentId]);
    const own = await pendingFixture();
    await t.owner.query("UPDATE source_documents SET status='extracting' WHERE id=$1", [own.documentId]);
    const many = await t.call(
      own.main,
      'GET',
      '/api/source-documents?status=extracting&status=pending_review',
    );
    expect(((await many.json()) as { id: string }[]).map((d) => d.id)).toEqual([own.documentId]);
    const review = (await (
      await t.call(main, 'GET', `/api/source-documents/${documentId}/review`)
    ).json()) as DocumentReview;
    expect(review.extraction).toEqual(reading);
    expect(JSON.stringify(review)).not.toMatch(/families\//);
    const image = await t.call(main, 'GET', `/api/source-documents/${documentId}/image`);
    expect(image.headers.get('content-type')).toBe('image/jpeg');
    expect(new Uint8Array(await image.arrayBuffer())).toEqual(JPEG);
  });

  it('TC-034 → TC-032 → TC-033 → TC-035: chưa duyệt không có số đo; 1300 bị chặn; sửa 130 thì lưu; duyệt lại bị từ chối', async () => {
    const { main, profile, documentId, key } = await pendingFixture();
    expect(await measurementsOf(main, profile.id)).toEqual([]);
    const blocked = await approve(main, documentId);
    expect(blocked.status).toBe(422);
    expect(await blocked.json()).toMatchObject({
      error: { code: 'ERR_OUT_OF_RANGE_UNCONFIRMED', details: { fields: ['systolic'] } },
    });
    const approved = await approve(main, documentId, { systolic: 130 });
    expect(approved.status).toBe(200);
    const body = (await approved.json()) as ApprovedDocumentResponse;
    expect(body.document).toMatchObject({ status: 'approved', documentDate: '2026-10-05' });
    expect(await measurementsOf(main, profile.id)).toEqual([
      expect.objectContaining({
        sourceDocumentId: documentId,
        kind: 'blood_pressure',
        systolic: 130,
        diastolic: 90,
      }),
    ]);
    expect(t.objects.get(key)!.body).toEqual(JPEG);
    const again = await approve(main, documentId, { systolic: 130 });
    expect(again.status).toBe(409);
    expect(await again.json()).toMatchObject({ error: { code: 'ERR_INVALID_STATE_TRANSITION' } });
  });

  it('SPEC-010: thiếu ngày → ERR_DOCUMENT_DATE_REQUIRED; đường huyết lưu đơn vị gốc và trả kind glucose', async () => {
    const { main, profile, documentId } = await pendingFixture();
    const missing = await approve(main, documentId, { measuredAt: null, systolic: 130 });
    expect(await missing.json()).toMatchObject({ error: { code: 'ERR_DOCUMENT_DATE_REQUIRED' } });
    const glucose = { kind: 'glucose', glucoseValue: 7.2, glucoseUnit: null };
    const noUnit = await approve(main, documentId, glucose);
    expect(await noUnit.json()).toMatchObject({ error: { code: 'ERR_GLUCOSE_UNIT_REQUIRED' } });
    expect((await approve(main, documentId, { ...glucose, glucoseUnit: 'mmol/L' })).status).toBe(200);
    const row = (
      await t.owner.query(
        'SELECT kind, glucose_value, systolic FROM measurements WHERE source_document_id=$1',
        [documentId],
      )
    ).rows[0];
    expect(row).toEqual({ kind: 'blood_glucose', glucose_value: '7.2', systolic: null });
    expect(await measurementsOf(main, profile.id)).toEqual([
      expect.objectContaining({ kind: 'glucose', glucoseValue: 7.2, glucoseUnit: 'mmol/L' }),
    ]);
  });

  it('SPEC-006: main nhóm khác nhận lỗi giống tài nguyên không tồn tại, không ghi gì', async () => {
    const { profile, documentId } = await pendingFixture();
    const other = await t.session(await t.family());
    const missing = randomUUID();
    for (const path of ['review', 'image']) {
      await expectCrossFamilyDenied(
        () => t.call(other, 'GET', `/api/source-documents/${documentId}/${path}`),
        () => t.call(other, 'GET', `/api/source-documents/${missing}/${path}`),
      );
    }
    await expectCrossFamilyDenied(
      () => approve(other, documentId, { systolic: 130 }),
      () => approve(other, missing, { systolic: 130 }),
    );
    await expectCrossFamilyDenied(
      () => t.call(other, 'GET', `/api/health-profiles/${profile.id}/measurements`),
      () => t.call(other, 'GET', `/api/health-profiles/${missing}/measurements`),
    );
    const status = (await t.owner.query('SELECT status FROM source_documents WHERE id=$1', [documentId]))
      .rows[0];
    expect(status).toEqual({ status: 'pending_review' });
  });

  it('member và lệnh duyệt thiếu CSRF bị chặn 403; loại khác device_reading → ERR_VALIDATION', async () => {
    const { familyId, main, documentId } = await pendingFixture();
    const member = await t.session(familyId, 'member', 'Thành viên');
    expect((await t.call(member, 'GET', '/api/source-documents')).status).toBe(403);
    const noCsrf = await t.app.request(`/api/source-documents/${documentId}/approve`, {
      method: 'POST',
      headers: { cookie: main.cookie, 'content-type': 'application/json' },
      body: JSON.stringify({ type: 'device_reading', data: { ...reading, systolic: 130 } }),
    });
    expect(noCsrf.status).toBe(403);
    const prescription = await t.call(main, 'POST', `/api/source-documents/${documentId}/approve`, {
      type: 'prescription',
      data: reading,
    });
    expect(await prescription.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
  });
});
