import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { budgetMonth, type PrivacyDraft } from '@angia/contracts';
import { seedOcrAdmission } from '@src/shared/test/seedOcrAdmission.js';
import { createAwaitingPrivacyFixture } from '@src/shared/test/createAwaitingPrivacyFixture.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const edits = { rotation: 0, crop: { left: 0, top: 0, width: 1_000_000, height: 1_000_000 }, masks: [] };
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 7]);
describe('CP5.4: duyệt riêng tư qua cổng lượt và phí thực, PostgreSQL + pg-boss', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());
  beforeEach(async () => {
    await t.owner.query('TRUNCATE ai_billing_sources CASCADE');
  });
  const ready = async () => {
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
    return { ...f, approval: { draftId: draft.draftId, sha256, confirmed: true } };
  };
  it.each([
    ['hết lượt', 0, '0', false, 'awaiting_budget'],
    ['phí đạt trần', 20, '5', false, 'awaiting_budget'],
    ['coverage stale', 20, '0', true, 'awaiting_budget'],
    ['phí sát dưới trần và bỏ qua tiền gia đình cũ', 20, '4.999999999999', false, 'extracting'],
  ] as const)(
    'TC-628: %s, duyệt giữ guard và enqueue đúng',
    async (_label, granted, cost, stale, expected) => {
      const f = await ready();
      const now = new Date(),
        month = budgetMonth(now);
      await seedOcrAdmission(t.owner, f.familyId, now, granted);
      await t.owner.query(
        'INSERT INTO extraction_spend(month,cap_usd) VALUES($1,5) ON CONFLICT(month) DO UPDATE SET cap_usd=5',
        [month],
      );
      await t.owner.query(
        'INSERT INTO family_extraction_spend(family_id,month,spent_usd) VALUES($1,$2,0.49)',
        [f.familyId, month],
      );
      const source = (await t.owner.query("SELECT id FROM ai_billing_sources WHERE provider='openrouter'"))
        .rows[0].id;
      await t.owner.query(
        `INSERT INTO ai_provider_charges(source_id,external_id,charged_at,counter_amount,unit_divisor)
      VALUES($1,'charge',$2,$3,1)`,
        [source, now, cost],
      );
      if (stale)
        await t.owner.query("UPDATE ai_billing_sources SET last_complete_at=now()-interval '4 minutes'");
      const response = await t.call(f.main, 'POST', `${f.path}/privacy-approval`, f.approval);
      expect(response.status).toBe(200);
      expect(await response.json()).toMatchObject({ status: expected });
      const row = (
        await t.owner.query('SELECT status,privacy_approved_at FROM source_documents WHERE id=$1', [
          f.documentId,
        ])
      ).rows[0];
      expect(row.status).toBe(expected);
      expect(row.privacy_approved_at).not.toBeNull();
      expect(
        (
          await t.owner.query(
            "SELECT count(*)::int AS n FROM pgboss.job WHERE name='extract-document' AND data->>'documentId'=$1",
            [f.documentId],
          )
        ).rows[0].n,
      ).toBe(expected === 'extracting' ? 1 : 0);
      expect((await t.call(f.main, 'POST', `${f.path}/privacy-approval`, f.approval)).status).toBe(200);
    },
  );
});
