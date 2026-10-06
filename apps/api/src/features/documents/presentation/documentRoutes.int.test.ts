import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { ConsentInvitationCreated, HealthProfile, UploadBatchResponse } from '@angia/contracts';
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

describe('Tải ảnh chứng từ: route thật, transaction và RLS (E2-S5-T1)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
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
        'SELECT (SELECT count(*)::int FROM upload_batches) AS batches, (SELECT count(*)::int FROM source_documents) AS documents',
      )
    ).rows[0];
  const profileFixture = async (consented = true) => {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const created = await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Mẹ' });
    const profile = (await created.json()) as HealthProfile;
    if (consented) await consent(main, profile.id);
    return { familyId, main, profile };
  };
  const consent = async (main: SeededSession, profileId: string) => {
    const invitation = await t.call(main, 'POST', `/api/health-profiles/${profileId}/consent-invitations`);
    const { token } = (await invitation.json()) as ConsentInvitationCreated;
    const responded = await t.app.request('/api/consent-invitations/respond', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
        origin: 'http://localhost:5173',
      },
      body: JSON.stringify({ decision: 'accepted', basis: 'self', respondentName: 'Mẹ' }),
    });
    expect(responded.status).toBe(200);
  };

  it('TC-011 → TC-012 → TC-020: chặn khi chưa đồng thuận, sau khi người nhận đồng ý thì lưu ảnh 3 MB', async () => {
    const { familyId, main, profile } = await profileFixture(false);
    const before = await counts();
    const blocked = await upload(main, profile.id, [{ name: 'don.jpg', bytes: image(3 * MiB) }]);
    expect(blocked.status).toBe(409);
    expect(await blocked.json()).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    expect(await counts()).toEqual(before);

    await consent(main, profile.id);
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
    ['TC-080: đúng 10 MiB được nhận', 10 * MiB, 201],
    ['TC-080: 10 MiB + 1 byte → ERR_NO_VALID_FILE', 10 * MiB + 1, 422],
    ['TC-026: tệp 20 MB bị chặn trước khi parse → ERR_NO_VALID_FILE', 20 * MiB, 422],
  ])('%s', async (_name, size, status) => {
    const fixture = await profileFixture();
    const before = await counts();
    const response = await upload(fixture.main, fixture.profile.id, [{ name: 'a.jpg', bytes: image(size) }]);
    expect(response.status).toBe(status);
    if (status === 422) {
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_NO_VALID_FILE' } });
      expect(await counts()).toEqual(before);
    }
  });

  it('TC-024: tệp PDF duy nhất → ERR_NO_VALID_FILE; 0 hoặc 2 tệp, loại khai báo sai → ERR_VALIDATION', async () => {
    const fixture = await profileFixture();
    const before = await counts();
    const pdf = await upload(fixture.main, fixture.profile.id, [
      { name: 'a.pdf', bytes: new TextEncoder().encode('%PDF-1.7 ...') },
    ]);
    expect(pdf.status).toBe(422);
    expect(await pdf.json()).toMatchObject({ error: { code: 'ERR_NO_VALID_FILE' } });
    const jpg = { name: 'a.jpg', bytes: image(1024) };
    for (const response of [
      await upload(fixture.main, fixture.profile.id, []),
      await upload(fixture.main, fixture.profile.id, [jpg, jpg]),
      await upload(fixture.main, fixture.profile.id, [jpg], { declaredType: 'xray' }),
    ]) {
      expect(response.status).toBe(422);
      expect(await response.json()).toMatchObject({ error: { code: 'ERR_VALIDATION' } });
    }
    expect(await counts()).toEqual(before);
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
