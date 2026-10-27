import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { budgetMonth, type PrivacyDraft } from '@angia/contracts';
import { ATTESTATION, profileConsentFixture } from '@src/shared/test/profileConsentFixture.js';
import { seedPendingDocument } from '@src/shared/test/seedPendingDocument.js';
import { seedOcrAdmission } from '@src/shared/test/seedOcrAdmission.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const edits = { rotation: 0, crop: { left: 0, top: 0, width: 1_000_000, height: 1_000_000 }, masks: [] };
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 7]);
describe.each(['main_attested', 'self'] as const)('LG-02: duyệt riêng tư nguồn %s', (source) => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  it.each([0, 20])('TC-610–614: quota %i giữ cổng OCR, chỉ enqueue khi còn lượt', async (granted) => {
    const f = await profileConsentFixture(t);
    const profile = await f.create(
      source === 'self'
        ? { linkedAccountId: f.main.accountId, consent: { kind: 'self' } }
        : { consent: ATTESTATION },
    );
    const now = new Date();
    await seedOcrAdmission(t.owner, f.familyId, now, granted);
    const { documentId } = await seedPendingDocument(
      t,
      { familyId: f.familyId, profileId: profile.id, accountId: f.main.accountId },
      {},
    );
    await t.owner.query("UPDATE source_documents SET status='awaiting_privacy' WHERE id=$1", [documentId]);
    const path = `/api/source-documents/${documentId}`;
    const response = await t.call(f.main, 'POST', `${path}/privacy-drafts`, edits);
    expect(response.status).toBe(202);
    const draft = (await response.json()) as Extract<PrivacyDraft, { draftId: string }>;
    const key = `families/${f.familyId}/profiles/${profile.id}/documents/${documentId}/ocr/${draft.draftId}/${randomUUID()}.png`;
    const sha256 = createHash('sha256').update(png).digest('hex');
    t.objects.set(key, { body: png, contentType: 'image/png' });
    await t.owner.query(
      `UPDATE source_documents SET privacy_draft_status='ready',ocr_image_key=$1,ocr_image_sha256=$2 WHERE id=$3`,
      [key, sha256, documentId],
    );
    const approved = await t.call(f.main, 'POST', `${path}/privacy-approval`, {
      draftId: draft.draftId,
      sha256,
      confirmed: true,
    });
    expect(approved.status).toBe(200);
    expect(
      (await t.owner.query('SELECT privacy_approved_by FROM source_documents WHERE id=$1', [documentId]))
        .rows[0].privacy_approved_by,
    ).toBe(f.main.accountId);
    expect(await approved.json()).toMatchObject({
      status: granted ? 'extracting' : 'awaiting_budget',
    });
    expect(
      (
        await t.owner.query(
          `SELECT count(*)::int AS n FROM pgboss.job WHERE name='extract-document' AND data->>'documentId'=$1`,
          [documentId],
        )
      ).rows[0].n,
    ).toBe(granted ? 1 : 0);
    expect(
      (
        await t.owner.query(
          'SELECT used_scans::int AS used, held_scans::int AS held FROM family_scan_quotas WHERE family_id=$1 AND month=$2',
          [f.familyId, budgetMonth(now)],
        )
      ).rows[0],
    ).toEqual({ used: 0, held: 0 });
  });
});
