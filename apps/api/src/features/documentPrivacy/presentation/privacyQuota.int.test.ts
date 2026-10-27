import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrivacyDraft } from '@angia/contracts';
import { createAwaitingPrivacyFixture } from '@src/shared/test/createAwaitingPrivacyFixture.js';
import { seedOcrAdmission } from '@src/shared/test/seedOcrAdmission.js';
import { seedQuotaDocument } from '@src/shared/test/seedQuotaDocument.js';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';

const edits = { rotation: 0, crop: { left: 0, top: 0, width: 1_000_000, height: 1_000_000 }, masks: [] };
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 7]);

describe('Quota chờ worker ở bước riêng tư: route thật + pg-boss (SPEC-030)', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => t?.stop());

  it('TC-299: 10 chứng từ đang chờ worker → tạo bản kiểm tra và xác nhận gửi AI đều 429, không tạo job', async () => {
    const f = await createAwaitingPrivacyFixture(t);
    await seedOcrAdmission(t.owner, f.familyId);
    const created = await t.call(f.main, 'POST', `${f.path}/privacy-drafts`, edits);
    expect(created.status).toBe(202);
    const draft = (await created.json()) as Extract<PrivacyDraft, { draftId: string }>;
    const key = `families/${f.familyId}/profiles/${f.profile.id}/documents/${f.documentId}/ocr/${draft.draftId}/${randomUUID()}.png`;
    const sha256 = createHash('sha256').update(png).digest('hex');
    t.objects.set(key, { body: png, contentType: 'image/png' });
    await t.owner.query(
      "UPDATE source_documents SET privacy_draft_status='ready',ocr_image_key=$1,ocr_image_sha256=$2 WHERE id=$3",
      [key, sha256, f.documentId],
    );
    const owner = { familyId: f.familyId, profileId: f.profile.id, accountId: f.main.accountId };
    for (let i = 0; i < 10; i += 1) await seedQuotaDocument(t, owner, { status: 'uploaded', sizeBytes: 1 });

    const approval = await t.call(f.main, 'POST', `${f.path}/privacy-approval`, {
      draftId: draft.draftId,
      sha256,
      confirmed: true,
    });
    expect(approval.status).toBe(429);
    expect(approval.headers.get('retry-after')).toBe('30');
    expect(await approval.json()).toMatchObject({
      error: { code: 'ERR_QUEUE_QUOTA', details: { used: 10, limit: 10, requested: 1 } },
    });
    const redraft = await t.call(f.main, 'POST', `${f.path}/privacy-drafts`, edits);
    expect(redraft.status).toBe(429);
    const jobs = await t.owner.query(
      "SELECT count(*)::int AS n FROM pgboss.job WHERE name='extract-document' AND data->>'documentId'=$1",
      [f.documentId],
    );
    expect(jobs.rows[0].n).toBe(0);
    const row = await t.owner.query('SELECT status, privacy_draft_id FROM source_documents WHERE id=$1', [
      f.documentId,
    ]);
    expect(row.rows[0]).toEqual({ status: 'awaiting_privacy', privacy_draft_id: draft.draftId });
  });
});
