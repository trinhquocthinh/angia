import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile, PrivacyDraft } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { expectCrossFamilyDenied } from '@src/shared/test/expectCrossFamilyDenied.js';
const edits = { rotation: 0, crop: { left: 0, top: 0, width: 1_000_000, height: 1_000_000 }, masks: [] };
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 7]);
describe('Bảo vệ ảnh: PostgreSQL và queue thật', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const fixture = async () => {
    const familyId = await t.family(),
      main = await t.session(familyId);
    const profile = (await (
      await t.call(main, 'POST', '/api/health-profiles', { displayName: 'Ba' })
    ).json()) as HealthProfile;
    await acceptConsentInvitation(t, main, profile.id);
    const { documentId } = await seedPendingDocument(
      t,
      { familyId, profileId: profile.id, accountId: main.accountId },
      {},
    );
    await t.owner.query("UPDATE source_documents SET status='awaiting_privacy' WHERE id=$1", [documentId]);
    return { familyId, main, profile, documentId, path: `/api/source-documents/${documentId}` };
  };
  const ready = async (f: Awaited<ReturnType<typeof fixture>>) => {
    const response = await t.call(f.main, 'POST', f.path + '/privacy-drafts', edits);
    expect(response.status).toBe(202);
    const draft = (await response.json()) as PrivacyDraft;
    if (draft.state === 'none') throw new Error('Thiếu bản nháp');
    const key = `families/${f.familyId}/profiles/${f.profile.id}/documents/${f.documentId}/ocr/${draft.draftId}/${randomUUID()}.png`;
    const sha256 = createHash('sha256').update(png).digest('hex');
    t.objects.set(key, { body: png, contentType: 'image/png' });
    await t.owner.query(
      "UPDATE source_documents SET privacy_draft_status='ready',ocr_image_key=$1,ocr_image_sha256=$2 WHERE id=$3",
      [key, sha256, f.documentId],
    );
    return { draftId: draft.draftId, sha256, confirmed: true, key };
  };
  it('TC-175: enqueue pending cùng transaction và luồng ready → xác nhận idempotent', async () => {
    const f = await fixture();
    const d = await ready(f);
    const jobs = await t.owner.query(
      "SELECT id,data FROM pgboss.job WHERE name='prepare-ocr-image' AND id=$1",
      [d.draftId],
    );
    expect(jobs.rows).toHaveLength(1);
    expect(jobs.rows[0].data).toEqual({
      documentId: f.documentId,
      familyId: f.familyId,
      draftId: d.draftId,
      edits,
    });
    const status = await t.call(f.main, 'GET', f.path + '/privacy-draft');
    expect(status.headers.get('cache-control')).toBe('no-store');
    expect(await status.json()).toEqual({
      state: 'ready',
      draftId: d.draftId,
      sha256: d.sha256,
      imageUrl: f.path + `/privacy-drafts/${d.draftId}/image`,
    });
    const image = await t.call(f.main, 'GET', f.path + `/privacy-drafts/${d.draftId}/image`);
    expect(image.headers.get('x-content-type-options')).toBe('nosniff');
    expect(new Uint8Array(await image.arrayBuffer())).toEqual(png);
    const body = { draftId: d.draftId, sha256: d.sha256, confirmed: true };
    const approved = await t.call(f.main, 'POST', f.path + '/privacy-approval', body);
    expect(approved.status).toBe(200);
    expect((await t.call(f.main, 'POST', f.path + '/privacy-approval', body)).status).toBe(200);
    const row = (
      await t.owner.query('SELECT privacy_approved_by,status FROM source_documents WHERE id=$1', [
        f.documentId,
      ])
    ).rows[0];
    expect(row).toEqual({ privacy_approved_by: f.main.accountId, status: 'extracting' });
    expect(
      (
        await t.owner.query(
          "SELECT count(*)::int AS n FROM pgboss.job WHERE name='extract-document' AND data->>'documentId'=$1",
          [f.documentId],
        )
      ).rows[0].n,
    ).toBe(1);
  });
  it('TC-176: cả năm route khác gia đình giống tài nguyên không tồn tại', async () => {
    const f = await fixture(),
      other = await t.session(await t.family()),
      missing = randomUUID(),
      draftId = randomUUID();
    const routes = [
      ['POST', 'privacy-drafts', edits],
      ['GET', 'privacy-draft', undefined],
      ['GET', `privacy-drafts/${draftId}/image`, undefined],
      ['POST', 'privacy-approval', { draftId, sha256: 'a'.repeat(64), confirmed: true }],
      ['POST', 'manual-entry', undefined],
    ] as const;
    for (const [method, suffix, body] of routes)
      await expectCrossFamilyDenied(
        () => t.call(other, method, f.path + '/' + suffix, body),
        () => t.call(other, method, `/api/source-documents/${missing}/${suffix}`, body),
      );
  });
  it('TC-177: phiên/main/CSRF và body 16KiB/strict shape', async () => {
    const f = await fixture(),
      member = await t.session(f.familyId, 'member');
    expect((await t.app.request(f.path + '/privacy-draft')).status).toBe(401);
    expect((await t.call(member, 'GET', f.path + '/privacy-draft')).status).toBe(403);
    expect(
      (
        await t.app.request(f.path + '/privacy-drafts', {
          method: 'POST',
          headers: { cookie: f.main.cookie, 'content-type': 'application/json' },
          body: JSON.stringify(edits),
        })
      ).status,
    ).toBe(403);
    expect(
      (await t.call(f.main, 'POST', f.path + '/privacy-drafts', { ...edits, familyId: f.familyId })).status,
    ).toBe(422);
    const large = await t.app.request(f.path + '/privacy-drafts', {
      method: 'POST',
      headers: { cookie: f.main.cookie, 'x-csrf-token': f.main.csrf, 'content-type': 'application/json' },
      body: JSON.stringify(edits) + ' '.repeat(16 * 1024),
    });
    expect(large.status).toBe(413);
  });
  it('TC-178: CHECK và trigger khóa draft/hash sau khi main xác nhận', async () => {
    const f = await fixture();
    await expect(
      t.owner.query("UPDATE source_documents SET privacy_draft_status='ready' WHERE id=$1", [f.documentId]),
    ).rejects.toMatchObject({ constraint: 'source_documents_privacy_draft_complete' });
    const d = await ready(f);
    await t.call(f.main, 'POST', f.path + '/privacy-approval', {
      draftId: d.draftId,
      sha256: d.sha256,
      confirmed: true,
    });
    for (const [column, value] of [
      ['privacy_draft_id', randomUUID()],
      ['privacy_draft_status', 'failed'],
      ['ocr_image_sha256', 'b'.repeat(64)],
    ])
      await expect(
        t.owner.query(`UPDATE source_documents SET ${column}=$1 WHERE id=$2`, [value, f.documentId]),
      ).rejects.toMatchObject({ constraint: 'source_documents_privacy_immutable' });
  });
  it('TC-179: pending terminal phục hồi, nhập tay và ảnh cũ bị chặn', async () => {
    const f = await fixture();
    const response = await t.call(f.main, 'POST', f.path + '/privacy-drafts', edits);
    expect(response.status).toBe(202);
    const draft = (await response.json()) as Exclude<PrivacyDraft, { state: 'none' }>;
    expect((await t.call(f.main, 'POST', f.path + '/privacy-drafts', edits)).status).toBe(409);
    await t.owner.query("UPDATE pgboss.job SET state='failed' WHERE id=$1", [draft.draftId]);
    expect(await (await t.call(f.main, 'GET', f.path + '/privacy-draft')).json()).toEqual({
      state: 'failed',
      draftId: draft.draftId,
    });
    expect((await t.call(f.main, 'POST', f.path + '/manual-entry')).status).toBe(200);
    expect((await t.call(f.main, 'POST', f.path + '/privacy-drafts', edits)).status).toBe(409);
    expect((await t.call(f.main, 'GET', f.path + `/privacy-drafts/${draft.draftId}/image`)).status).toBe(404);
  });
  it('TC-175b: hai tab tạo/xác nhận chỉ một enqueue; manual cạnh tranh chỉ một trạng thái thắng', async () => {
    const f = await fixture();
    const requests = await Promise.all([
      t.call(f.main, 'POST', f.path + '/privacy-drafts', edits),
      t.call(f.main, 'POST', f.path + '/privacy-drafts', edits),
    ]);
    expect(requests.map((r) => r.status).sort()).toEqual([202, 409]);
    const pending = (await requests.find((r) => r.status === 202)!.json()) as Exclude<
      PrivacyDraft,
      { state: 'none' }
    >;
    const key = `families/${f.familyId}/profiles/${f.profile.id}/documents/${f.documentId}/ocr/${pending.draftId}/${randomUUID()}.png`;
    const sha256 = createHash('sha256').update(png).digest('hex');
    t.objects.set(key, { body: png, contentType: 'application/octet-stream' });
    await t.owner.query(
      "UPDATE source_documents SET privacy_draft_status='ready',ocr_image_key=$1,ocr_image_sha256=$2 WHERE id=$3",
      [key, sha256, f.documentId],
    );
    const body = { draftId: pending.draftId, sha256, confirmed: true };
    const approvals = await Promise.all([
      t.call(f.main, 'POST', f.path + '/privacy-approval', body),
      t.call(f.main, 'POST', f.path + '/privacy-approval', body),
    ]);
    expect(approvals.map((r) => r.status)).toEqual([200, 200]);
    expect(
      (
        await t.owner.query(
          "SELECT count(*)::int n FROM pgboss.job WHERE name='extract-document' AND data->>'documentId'=$1",
          [f.documentId],
        )
      ).rows[0].n,
    ).toBe(1);
    const g = await fixture(),
      draft = await ready(g),
      payload = { draftId: draft.draftId, sha256: draft.sha256, confirmed: true };
    const race = await Promise.all([
      t.call(g.main, 'POST', g.path + '/manual-entry'),
      t.call(g.main, 'POST', g.path + '/privacy-approval', payload),
    ]);
    expect(race.map((r) => r.status).sort()).toEqual([200, 409]);
  });
  it('TC-177c: Content-Length thấp không bỏ qua giới hạn luồng', async () => {
    const f = await fixture();
    const request = await t.app.request(f.path + '/privacy-drafts', {
      method: 'POST',
      headers: {
        cookie: f.main.cookie,
        'x-csrf-token': f.main.csrf,
        'content-type': 'application/json',
        'content-length': '1',
      },
      body: JSON.stringify(edits) + ' '.repeat(16 * 1024),
    });
    expect(request.status).toBe(413);
  });
});
