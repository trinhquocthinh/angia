import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { HealthProfile, SourceDocumentPage } from '@angia/contracts';
import { acceptConsentInvitation } from '@src/shared/test/acceptConsentInvitation.js';
import { manualReading } from '@src/shared/test/healthDataFixtures.js';
import type { SeededSession } from '@src/shared/test/seedAuthFixtures.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { SEEDED_MEDICATIONS, seedReminder } from '@src/shared/test/seedReminder.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const SECRET_SYSTOLIC = 187;
const reading = { ...manualReading, systolic: SECRET_SYSTOLIC };
const lab = {
  type: 'lab_result',
  resultDate: '2026-10-02',
  facility: null,
  items: [{ testName: 'HbA1c-Zeta', value: '7,2', unit: '%', referenceRange: null }],
};
const profiles = '/api/health-profiles';
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 7]);

describe('Gate đồng thuận sau khi rút: đọc, ảnh, duyệt (F07 §4.4)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });

  const createProfile = async (main: SeededSession, body: object) =>
    (await (await t.call(main, 'POST', profiles, body)).json()) as HealthProfile;

  // Hồ sơ Bà Tư đã đồng thuận kèm đủ dữ liệu, liên kết tài khoản Bà; hồ sơ đối chứng của cùng gia đình.
  const fixture = async () => {
    const familyId = await t.family();
    const main = await t.session(familyId, 'main', 'Bố');
    const grandma = await t.session(familyId, 'member', 'Bà');
    const profile = await createProfile(main, { displayName: 'Bà Tư', linkedAccountId: grandma.accountId });
    const control = await createProfile(main, { displayName: 'Ông Năm' });
    for (const p of [profile, control]) await acceptConsentInvitation(t, main, p.id);
    const base = `${profiles}/${profile.id}`;
    const records = (type: string, data: object) =>
      t.call(main, 'POST', `${base}/manual-records`, { type, data });
    expect((await records('device_reading', reading)).status).toBe(200);
    expect((await records('lab_result', lab)).status).toBe(200);
    await t.call(main, 'PUT', `${base}/dose-slots`, { slots: { morning: '07:00' } });
    await t.call(main, 'PUT', `${base}/reminder-recipients`, { recipientAccountIds: [grandma.accountId] });
    const owner = { familyId, profileId: profile.id, accountId: main.accountId };
    const pending = await seedPendingDocument(t, owner, reading);
    const controlOwner = { ...owner, profileId: control.id };
    const controlDoc = await seedPendingDocument(t, controlOwner, reading);
    const privacy = await seedPrivacyDocument(owner);
    const reminderId = await seedReminder(t.owner, familyId, profile.id, grandma.accountId);
    return { familyId, main, grandma, profile, control, base, pending, controlDoc, privacy, reminderId };
  };
  const seedPrivacyDocument = async (owner: { familyId: string; profileId: string; accountId: string }) => {
    const { documentId } = await seedPendingDocument(t, owner, reading);
    const draftId = randomUUID();
    const key = `families/${owner.familyId}/profiles/${owner.profileId}/documents/${documentId}/ocr/${draftId}/${randomUUID()}.png`;
    t.objects.set(key, { body: png, contentType: 'image/png' });
    await t.owner.query(
      `UPDATE source_documents SET status='awaiting_privacy', privacy_draft_id=$1,
         privacy_draft_status='ready', ocr_image_key=$2, ocr_image_sha256=$4 WHERE id=$3`,
      [draftId, key, documentId, createHash('sha256').update(png).digest('hex')],
    );
    return { documentId, draftId };
  };
  const withdraw = async (f: Awaited<ReturnType<typeof fixture>>) =>
    expect((await t.call(f.grandma, 'POST', '/api/me/consent/withdraw', {})).status).toBe(200);
  const expectBlocked = async (response: Response) => {
    const text = await response.text();
    expect(response.status).toBe(409);
    expect(JSON.parse(text)).toMatchObject({ error: { code: 'ERR_CONSENT_REQUIRED' } });
    for (const secret of [String(SECRET_SYSTOLIC), 'HbA1c-Zeta', 'Canxi']) expect(text).not.toContain(secret);
  };

  it('TC-380: hồ sơ đã rút đồng thuận → mọi route đọc, ảnh, duyệt của hồ sơ đó nhận ERR_CONSENT_REQUIRED', async () => {
    const f = await fixture();
    await withdraw(f);
    const doc = `/api/source-documents/${f.pending.documentId}`;
    const privacyDoc = `/api/source-documents/${f.privacy.documentId}`;
    const reads = [
      `${f.base}/measurements`,
      `${f.base}/measurements/series?kind=blood_pressure&from=2026-10-01&to=2026-10-31`,
      `${f.base}/lab-result-series`,
      `${f.base}/document-entries`,
      `${f.base}/dose-slots`,
      `${f.base}/reminder-recipients`,
      `${doc}/review`,
      `${doc}/image`,
      `${doc}/image?variant=original`,
      `${privacyDoc}/privacy-draft`,
      `${privacyDoc}/privacy-drafts/${f.privacy.draftId}/image`,
    ];
    for (const path of reads) await expectBlocked(await t.call(f.main, 'GET', path));
    const approve = await t.call(f.main, 'POST', `${doc}/approve`, { type: 'device_reading', data: reading });
    await expectBlocked(approve);
    const status = await t.owner.query('SELECT status FROM source_documents WHERE id=$1', [
      f.pending.documentId,
    ]);
    expect(status.rows[0].status).toBe('pending_review');
  });

  it('TC-380: hàng đợi chứng từ toàn gia đình ẩn chứng từ của hồ sơ đã rút, vẫn có của hồ sơ khác', async () => {
    const f = await fixture();
    await withdraw(f);
    const response = await t.call(f.main, 'GET', '/api/source-documents?status=pending_review');
    const ids = ((await response.json()) as SourceDocumentPage).items.map((item) => item.id);
    expect(ids).toContain(f.controlDoc.documentId);
    expect(ids).not.toContain(f.pending.documentId);
  });

  it('TC-380: ca đối chứng — hồ sơ confirmed khác vẫn đọc được số đo, xét nghiệm và chứng từ', async () => {
    const f = await fixture();
    await withdraw(f);
    const controlBase = `${profiles}/${f.control.id}`;
    for (const path of [
      `${controlBase}/measurements`,
      `${controlBase}/lab-result-series`,
      `${controlBase}/document-entries`,
      `${controlBase}/dose-slots`,
      `/api/source-documents/${f.controlDoc.documentId}/review`,
      `/api/source-documents/${f.controlDoc.documentId}/image`,
    ])
      expect((await t.call(f.main, 'GET', path)).status).toBe(200);
  });

  it('TC-380: danh sách hồ sơ vẫn trả hồ sơ với consentStatus withdrawn; xóa hồ sơ vẫn 204', async () => {
    const f = await fixture();
    await withdraw(f);
    const list = (await (await t.call(f.main, 'GET', profiles)).json()) as HealthProfile[];
    expect(list.find((p) => p.id === f.profile.id)?.consentStatus).toBe('withdrawn');
    const removed = await t.call(f.main, 'DELETE', `${profiles}/${f.profile.id}`, {
      confirmName: 'Bà Tư',
    });
    expect(removed.status).toBe(204);
  });

  it('TC-380: gửi lại lời mời với attestation vẫn 201 để đồng thuận lại (spec §4.5)', async () => {
    const f = await fixture();
    await withdraw(f);
    const invited = await t.call(f.main, 'POST', `${f.base}/consent-invitations`, { attestation: true });
    expect(invited.status).toBe(201);
  });

  it('TC-380: lời nhắc đã sinh trước khi rút → người nhận GET /api/me/reminders/:id nhận 404', async () => {
    const f = await fixture();
    expect((await t.call(f.grandma, 'GET', `/api/me/reminders/${f.reminderId}`)).status).toBe(200);
    await withdraw(f);
    const response = await t.call(f.grandma, 'GET', `/api/me/reminders/${f.reminderId}`);
    expect(response.status).toBe(404);
    expect(await response.text()).not.toContain(SEEDED_MEDICATIONS[0]!.name);
  });
});
