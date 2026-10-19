import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { budgetMonth, type PrivacyDraft } from '@angia/contracts';
import { createAwaitingPrivacyFixture } from '@src/shared/test/createAwaitingPrivacyFixture.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const edits = { rotation: 0, crop: { left: 0, top: 0, width: 1_000_000, height: 1_000_000 }, masks: [] };
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 7]);

describe('Duyệt riêng tư khi gia đình hết trần AI: route thật + pg-boss (SPEC-031)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());

  it('TC-306: gia đình đã dùng $0,49 / $0,50 → xác nhận gửi AI trả awaiting_budget, không tạo job OCR', async () => {
    const f = await createAwaitingPrivacyFixture(t);
    const draft = (await (await t.call(f.main, 'POST', `${f.path}/privacy-drafts`, edits)).json()) as Extract<
      PrivacyDraft,
      { draftId: string }
    >;
    const key = `families/${f.familyId}/profiles/${f.profile.id}/documents/${f.documentId}/ocr/${draft.draftId}/${randomUUID()}.png`;
    const sha256 = createHash('sha256').update(png).digest('hex');
    t.objects.set(key, { body: png, contentType: 'image/png' });
    await t.owner.query(
      "UPDATE source_documents SET privacy_draft_status='ready',ocr_image_key=$1,ocr_image_sha256=$2 WHERE id=$3",
      [key, sha256, f.documentId],
    );
    const month = budgetMonth(new Date());
    await t.owner.query(
      `INSERT INTO extraction_spend (month, cap_usd) VALUES ($1, 5) ON CONFLICT DO NOTHING`,
      [month],
    );
    await t.owner.query(
      `INSERT INTO family_extraction_spend (family_id, month, spent_usd) VALUES ($1, $2, 0.49)`,
      [f.familyId, month],
    );
    const response = await t.call(f.main, 'POST', `${f.path}/privacy-approval`, {
      draftId: draft.draftId,
      sha256,
      confirmed: true,
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ status: 'awaiting_budget' });
    const row = await t.owner.query('SELECT status, privacy_approved_at FROM source_documents WHERE id=$1', [
      f.documentId,
    ]);
    expect(row.rows[0].status).toBe('awaiting_budget');
    expect(row.rows[0].privacy_approved_at).not.toBeNull();
    const jobs = await t.owner.query(
      "SELECT count(*)::int AS n FROM pgboss.job WHERE name='extract-document' AND data->>'documentId'=$1",
      [f.documentId],
    );
    expect(jobs.rows[0].n).toBe(0);
  });
});
