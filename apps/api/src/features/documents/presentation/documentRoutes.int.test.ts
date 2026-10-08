import { randomUUID } from 'node:crypto';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import type { HealthProfile, UploadBatchResponse } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const MiB = 1024 * 1024;
const uploadPath = (id: string) => `/api/health-profiles/${id}/upload-batches`;
const image = (size: number, head = [0xff, 0xd8, 0xff, 0xe0]) => {
  const bytes = new Uint8Array(size);
  bytes.set(head);
  return bytes;
};
const HEIC_HEAD = [0, 0, 0, 24, ...[...'ftypheic'].map((c) => c.charCodeAt(0)), 0, 0, 0, 0];
const jpegs = (count: number) =>
  Array.from({ length: count }, (_, i) => ({ name: `${i}.jpg`, bytes: image(1024) }));
const pdf = { name: 'ket-qua.pdf', bytes: new TextEncoder().encode('%PDF-1.7 ...') };
const spoolDirs = async () => (await readdir(tmpdir())).filter((name) => name.startsWith('angia-upload-'));

describe('Tải chứng từ đơn lẻ/theo lô: route thật, transaction và RLS (E2-S5-T1, E3-S1-T1)', () => {
  let t: ProfileTestApp;
  let uploadTmpRoot: string;
  beforeAll(async () => {
    // Cô lập tệp tạm khỏi các suite upload chạy song song (TC-023).
    uploadTmpRoot = await mkdtemp(join(tmpdir(), 'angia-document-routes-'));
    for (const name of ['TMPDIR', 'TMP', 'TEMP']) vi.stubEnv(name, uploadTmpRoot);
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    try {
      await t?.stop();
    } finally {
      vi.unstubAllEnvs();
      if (uploadTmpRoot) await rm(uploadTmpRoot, { recursive: true, force: true });
    }
  });

  const upload = (
    user: SeededSession,
    profileId: string,
    files: { name: string; bytes: Uint8Array }[],
    fields: Record<string, string> = {},
    csrf = true,
  ) => {
    const form = new FormData();
    for (const file of files) form.append('files', new File([file.bytes], file.name));
    for (const [key, value] of Object.entries(fields)) form.append(key, value);
    return t.app.request(uploadPath(profileId), {
      method: 'POST',
      headers: { cookie: user.cookie, ...(csrf ? { 'x-csrf-token': user.csrf } : {}) },
      body: form,
    });
  };
  const counts = async () =>
    (
      await t.owner.query(
        `SELECT (SELECT count(*)::int FROM upload_batches) AS batches,
                (SELECT count(*)::int FROM source_documents) AS documents,
                (SELECT count(*)::int FROM pgboss.job WHERE name = 'extract-document') AS jobs`,
      )
    ).rows[0];
  const profileFixture = async (consented = true) => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const created = await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Mẹ' });
    const profile = (await created.json()) as HealthProfile;
    if (consented) await acceptConsentInvitation(t, main, profile.id);
    return { familyId, main, profile };
  };
  it('TC-011 → TC-012 → TC-020: chặn khi chưa đồng thuận, sau khi người nhận đồng ý thì lưu ảnh 3 MB', async () => {
    const { familyId, main, profile } = await profileFixture(false);
    const before = await counts();
    const blocked = await upload(main, profile.id, [{ name: 'don.jpg', bytes: image(3 * MiB) }]);
    expect(blocked.status).toBe(409);
    expect(await blocked.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    expect(await counts()).toEqual(before);

    await acceptConsentInvitation(t, main, profile.id);
    const response = await upload(main, profile.id, [{ name: 'Nguyen Van A.jpg', bytes: image(3 * MiB) }], {
      declaredType: 'prescription',
    });
    expect(response.status).toBe(201);
    expect(response.headers.get('cache-control')).toBe('no-store');
    const batch = (await response.json()) as UploadBatchResponse;
    expect(batch.rejectedFiles).toEqual([]);
    expect(batch.documents).toEqual([
      expect.objectContaining({
        healthProfileId: profile.id,
        batchId: batch.id,
        type: 'prescription',
        status: 'uploaded',
        documentDate: null,
        mimeType: 'image/jpeg',
        sizeBytes: 3 * MiB,
      }),
    ]);
    expect(JSON.stringify(batch)).not.toMatch(/families\/|Nguyen/);
    const documentId = batch.documents[0]!.id;
    const key = `families/${familyId}/profiles/${profile.id}/documents/${documentId}/original.jpg`;
    const row = (
      await t.owner.query('SELECT family_id, original_key, preview_key FROM source_documents WHERE id=$1', [
        documentId,
      ])
    ).rows[0];
    expect(row).toEqual({ family_id: familyId, original_key: key, preview_key: null });
    const batchRow = (await t.owner.query('SELECT created_by FROM upload_batches WHERE id=$1', [batch.id]))
      .rows[0];
    expect(batchRow.created_by).toBe(main.accountId);
    expect(t.objects.get(key)).toMatchObject({ contentType: 'image/jpeg' });
    expect(t.objects.get(key)!.body.length).toBe(3 * MiB);
    // E2-S5-T2: job OCR ghi cùng transaction, payload chỉ có ID (không tên tệp/hồ sơ).
    const jobs = await t.owner.query(`SELECT data, state FROM pgboss.job WHERE name = 'extract-document'`);
    expect(jobs.rows.filter((job) => job.data.documentId === documentId)).toEqual([
      { data: { documentId, familyId }, state: 'created' },
    ]);
  });

  it('SPEC-006: main nhóm khác nhận lỗi giống hồ sơ không tồn tại, không lưu gì', async () => {
    const { profile } = await profileFixture();
    const other = await t.session(await t.family());
    const before = await counts();
    const file = [{ name: 'a.jpg', bytes: image(1024) }];
    await expectCrossFamilyDenied(
      () => upload(other, profile.id, file),
      () => upload(other, randomUUID(), file),
    );
    expect(await counts()).toEqual(before);
  });

  it('TC-025: ảnh HEIC giữ nguyên định dạng gốc, chưa có bản xem trước', async () => {
    const { main, profile } = await profileFixture();
    const response = await upload(main, profile.id, [{ name: 'IMG.HEIC', bytes: image(2048, HEIC_HEAD) }]);
    expect(response.status).toBe(201);
    const { documents } = (await response.json()) as UploadBatchResponse;
    expect(documents[0]).toMatchObject({ mimeType: 'image/heic', type: null });
    expect([...t.objects.keys()].some((k) => k.endsWith(`${documents[0]!.id}/original.heic`))).toBe(true);
  });

  it.each([
    ['TC-021: 5 ảnh', 5],
    ['TC-081: đúng 10 ảnh (biên)', 10],
  ])('%s → cùng một UploadBatch, mỗi chứng từ một object S3 và một job', async (_name, count) => {
    const { main, profile } = await profileFixture();
    const before = await counts();
    const response = await upload(main, profile.id, jpegs(count));
    expect(response.status).toBe(201);
    const batch = (await response.json()) as UploadBatchResponse;
    expect(batch.documents).toHaveLength(count);
    expect(new Set(batch.documents.map((d) => d.batchId))).toEqual(new Set([batch.id]));
    expect(await counts()).toEqual({
      batches: before.batches + 1,
      documents: before.documents + count,
      jobs: before.jobs + count,
    });
  });

  it('TC-023: lô 11 tệp → 413 ERR_BATCH_TOO_LARGE, không lưu gì, không để lại tệp tạm', async () => {
    const { main, profile } = await profileFixture();
    const [before, dirs] = [await counts(), await spoolDirs()];
    const response = await upload(main, profile.id, jpegs(11));
    expect(response.status).toBe(413);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_BATCH_TOO_LARGE' } });
    expect([await counts(), await spoolDirs()]).toEqual([before, dirs]);
  });

  it('TC-024/TC-080: 9 ảnh + PDF, rồi ảnh đúng 10 MiB + ảnh 10 MiB + 1 byte → tệp lỗi vào rejectedFiles', async () => {
    const { main, profile } = await profileFixture();
    const mixed = await upload(main, profile.id, [...jpegs(9), pdf]);
    expect(mixed.status).toBe(201);
    const batch = (await mixed.json()) as UploadBatchResponse;
    expect(batch.documents).toHaveLength(9);
    expect(batch.rejectedFiles).toEqual([{ fileName: 'ket-qua.pdf', code: 'ERR_UNSUPPORTED_FILE' }]);

    const boundary = await upload(main, profile.id, [
      { name: 'vừa đủ.jpg', bytes: image(10 * MiB) },
      { name: 'quá lớn.jpg', bytes: image(10 * MiB + 1) },
    ]);
    expect(boundary.status).toBe(201);
    const sized = (await boundary.json()) as UploadBatchResponse;
    expect(sized.documents.map((d) => d.sizeBytes)).toEqual([10 * MiB]);
    expect(sized.rejectedFiles).toEqual([{ fileName: 'quá lớn.jpg', code: 'ERR_FILE_TOO_LARGE' }]);
  });

  it.each([
    ['TC-026: tệp 20 MB duy nhất', [{ name: 'a.jpg', bytes: image(20 * MiB) }]],
    ['TC-024: tệp PDF duy nhất', [pdf]],
  ])('%s → 422 ERR_NO_VALID_FILE, không lưu gì', async (_name, files) => {
    const fixture = await profileFixture();
    const before = await counts();
    const response = await upload(fixture.main, fixture.profile.id, files);
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_NO_VALID_FILE' } });
    expect(await counts()).toEqual(before);
  });

  it('0 tệp, loại khai báo sai, id hồ sơ không phải UUID → ERR_VALIDATION', async () => {
    const fixture = await profileFixture();
    const before = await counts();
    for (const response of [
      await upload(fixture.main, fixture.profile.id, []),
      await upload(fixture.main, fixture.profile.id, jpegs(1), { declaredType: 'xray' }),
      await upload(fixture.main, 'khong-phai-uuid', jpegs(1)),
    ]) {
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    expect(await counts()).toEqual(before);
  });

  it('TC-022: chứng từ của lô theo ngày tăng dần, chưa rõ ngày ở cuối; nhóm khác không thấy', async () => {
    const { main, profile } = await profileFixture();
    const batch = (await (await upload(main, profile.id, jpegs(3))).json()) as UploadBatchResponse;
    const [sep, unknown, aug] = batch.documents.map((d) => d.id);
    await t.owner.query(`UPDATE source_documents SET document_date = $2 WHERE id = $1`, [sep, '2026-09-05']);
    await t.owner.query(`UPDATE source_documents SET document_date = $2 WHERE id = $1`, [aug, '2026-08-01']);
    await upload(main, profile.id, jpegs(1));
    const listed = await t.call(main, 'GET', `/api/source-documents?batchId=${batch.id}`);
    expect(((await listed.json()) as { id: string }[]).map((d) => d.id)).toEqual([aug, sep, unknown]);
    const other = await t.session(await t.family());
    expect(await (await t.call(other, 'GET', `/api/source-documents?batchId=${batch.id}`)).json()).toEqual(
      [],
    );
  });

  it('member và request thiếu CSRF bị chặn 403, không phiên 401', async () => {
    const fixture = await profileFixture();
    const member = await t.session(fixture.familyId, 'member', 'Thành viên');
    const file = [{ name: 'a.jpg', bytes: image(1024) }];
    expect((await upload(member, fixture.profile.id, file)).status).toBe(403);
    expect((await upload(fixture.main, fixture.profile.id, file, {}, false)).status).toBe(403);
    expect((await t.app.request(uploadPath(fixture.profile.id), { method: 'POST' })).status).toBe(401);
  });
});
