import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { DocumentEntryPage, HealthProfile } from '@angia/contracts';
import { confirmConsentByAttestation } from '@src/shared/test/confirmConsentByAttestation.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
import { PENDING_JPEG, seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

describe('TC-408/TC-409: API một ảnh và ngừng luồng riêng tư cũ', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());

  async function fixture() {
    const familyId = await t.family();
    const main = await t.session(familyId);
    const profile = (await (
      await t.call(main, 'POST', '/api/health-profiles', { birthYear: 1950, displayName: 'Mẹ' })
    ).json()) as HealthProfile;
    await confirmConsentByAttestation(t, main, profile.id);
    const owner = { familyId, profileId: profile.id, accountId: main.accountId };
    return { familyId, main, profile, ...(await seedPendingDocument(t, owner, { type: 'device_reading' })) };
  }

  it('TC-408: mọi variant cũ chỉ trả một JPEG, no-store và nosniff', async () => {
    const f = await fixture();
    for (const query of ['', '?variant=original', '?variant=preview', '?variant=ocr', '?variant=unknown']) {
      const response = await t.call(f.main, 'GET', `/api/source-documents/${f.documentId}/image${query}`);
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('image/jpeg');
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('x-content-type-options')).toBe('nosniff');
      expect(new Uint8Array(await response.arrayBuffer())).toEqual(PENDING_JPEG);
    }
    const other = await t.session(await t.family());
    await expectCrossFamilyDenied(
      () => t.call(other, 'GET', `/api/source-documents/${f.documentId}/image?variant=original`),
      () => t.call(other, 'GET', `/api/source-documents/${randomUUID()}/image?variant=original`),
    );
    const member = await t.session(f.familyId, 'member', 'Thành viên');
    expect((await t.call(member, 'GET', `/api/source-documents/${f.documentId}/image`)).status).toBe(403);
    const unauthenticated = await t.app.request(`/api/source-documents/${f.documentId}/image`);
    expect(unauthenticated.status).toBe(401);
    expect(unauthenticated.headers.get('cache-control')).toBe('no-store');
    expect(unauthenticated.headers.get('x-content-type-options')).toBe('nosniff');
  });

  it('TC-408/TC-409: ảnh NULL → ERR_NOT_FOUND và hasImage false, ảnh còn → true', async () => {
    const f = await fixture();
    const entries = async () =>
      (await (
        await t.call(f.main, 'GET', `/api/health-profiles/${f.profile.id}/document-entries`)
      ).json()) as DocumentEntryPage;
    expect((await entries()).items[0]).toMatchObject({ id: f.documentId, hasImage: true });
    await t.owner.query('UPDATE source_documents SET image_key=NULL, image_sha256=NULL WHERE id=$1', [
      f.documentId,
    ]);
    const response = await t.call(f.main, 'GET', `/api/source-documents/${f.documentId}/image`);
    expect(response.status).toBe(404);
    expect(await response.json()).toMatchObject({ error: { code: 'ERR_NOT_FOUND' } });
    expect((await entries()).items[0]).toMatchObject({ id: f.documentId, hasImage: false });
  });

  it('TC-409: route riêng tư và loại bỏ trả 404, không đổi chứng từ', async () => {
    const f = await fixture();
    const base = `/api/source-documents/${f.documentId}`;
    for (const path of ['reject', 'privacy-drafts', 'privacy-approval', 'manual-entry']) {
      for (let attempt = 0; attempt < 12; attempt += 1) {
        expect((await t.call(f.main, 'POST', `${base}/${path}`, {})).status).toBe(404);
      }
    }
    for (const path of ['privacy-draft', `privacy-drafts/${randomUUID()}/image`]) {
      expect((await t.call(f.main, 'GET', `${base}/${path}`)).status).toBe(404);
    }
    expect(
      (await t.owner.query('SELECT status,image_key FROM source_documents WHERE id=$1', [f.documentId])).rows,
    ).toEqual([{ status: 'pending_review', image_key: f.key }]);
    expect(t.objects.get(f.key)?.body).toEqual(PENDING_JPEG);
  });
  it('TC-408: PNG OCR legacy trả đúng MIME, nguyên byte và vẫn cô lập gia đình', async () => {
    const f = await fixture();
    const id = randomUUID();
    const key = `families/${f.familyId}/profiles/${f.profile.id}/documents/${id}/ocr/${randomUUID()}/${randomUUID()}.png`;
    const bytes = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/hZkAAAAASUVORK5CYII=',
      'base64',
    );
    await t.owner.query(
      `INSERT INTO source_documents(id,family_id,health_profile_id,batch_id,status,
        image_key,image_sha256,mime_type,size_bytes,privacy_approved_by,privacy_approved_at)
       SELECT $1,family_id,health_profile_id,batch_id,'pending_review',
        $2,$3,'image/jpeg',$4,$5,now() FROM source_documents WHERE id=$6`,
      [
        id,
        key,
        createHash('sha256').update(bytes).digest('hex'),
        bytes.length,
        f.main.accountId,
        f.documentId,
      ],
    );
    t.objects.set(key, { body: bytes, contentType: 'application/octet-stream' });
    const response = await t.call(f.main, 'GET', `/api/source-documents/${id}/image`);
    expect(response.status).toBe(200);
    expect(response.headers.get('content-type')).toBe('image/png');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array(bytes));
    const other = await t.session(await t.family());
    await expectCrossFamilyDenied(
      () => t.call(other, 'GET', `/api/source-documents/${id}/image`),
      () => t.call(other, 'GET', `/api/source-documents/${randomUUID()}/image`),
    );
    const member = await t.session(f.familyId, 'member', 'Thành viên');
    expect((await t.call(member, 'GET', `/api/source-documents/${id}/image`)).status).toBe(403);
  });
});
