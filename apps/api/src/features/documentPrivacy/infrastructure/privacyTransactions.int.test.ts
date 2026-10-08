import { createHash, randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrivacyDraft } from '@angia/contracts';
import { startProfileTestApp, type ProfileTestApp } from '@src/shared/test/startProfileTestApp.js';
import { createAwaitingPrivacyFixture } from '@src/shared/test/createAwaitingPrivacyFixture.js';
import { createPrivacyIntegrationDeps } from '@src/shared/test/createPrivacyIntegrationDeps.js';
import { createPrivacyQueue } from './createPrivacyQueue.js';
import { createPrivacyDraft } from '../application/createPrivacyDraft.js';
import { approvePrivacy } from '../application/approvePrivacy.js';
const edits = {
  rotation: 0,
  crop: { left: 0, top: 0, width: 1_000_000, height: 1_000_000 },
  masks: [],
} as const;
const png = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 7]);
describe('Giao dịch và kiểm lại ảnh trên PostgreSQL thật', () => {
  let t: ProfileTestApp;
  beforeAll(async () => {
    t = await startProfileTestApp();
  });
  afterAll(async () => {
    await t?.stop();
  });
  const ready = async () => {
    const f = await createAwaitingPrivacyFixture(t);
    const draft = (await (await t.call(f.main, 'POST', f.path + '/privacy-drafts', edits)).json()) as Exclude<
      PrivacyDraft,
      { state: 'none' }
    >;
    const key = `families/${f.familyId}/profiles/${f.profile.id}/documents/${f.documentId}/ocr/${draft.draftId}/${randomUUID()}.png`;
    const sha256 = createHash('sha256').update(png).digest('hex');
    t.objects.set(key, { body: png, contentType: 'image/png' });
    await t.owner.query(
      "UPDATE source_documents SET privacy_draft_status='ready',ocr_image_key=$1,ocr_image_sha256=$2 WHERE id=$3",
      [key, sha256, f.documentId],
    );
    return { ...f, key, sha256, draftId: draft.draftId };
  };
  it('TC-175c: enqueue chuẩn bị lỗi sau INSERT job rollback cả dòng và job', async () => {
    const f = await createAwaitingPrivacyFixture(t),
      queue = createPrivacyQueue(t.boss);
    const deps = createPrivacyIntegrationDeps(t, {
      ...queue,
      prepare: async (tx, job) => {
        await queue.prepare(tx, job);
        throw new Error('Mất kết nối giả lập');
      },
    });
    await expect(
      createPrivacyDraft(deps, {
        familyId: f.familyId,
        documentId: f.documentId,
        edits: { ...edits, masks: [] },
      }),
    ).rejects.toThrow('Mất kết nối giả lập');
    expect(
      (
        await t.owner.query(
          'SELECT privacy_draft_id,privacy_draft_status FROM source_documents WHERE id=$1',
          [f.documentId],
        )
      ).rows[0],
    ).toEqual({ privacy_draft_id: null, privacy_draft_status: null });
    expect(
      (
        await t.owner.query("SELECT count(*)::int n FROM pgboss.job WHERE data->>'documentId'=$1", [
          f.documentId,
        ])
      ).rows[0].n,
    ).toBe(0);
  });
  it('TC-175d: enqueue OCR lỗi rollback dấu xác nhận và trạng thái extracting', async () => {
    const f = await ready(),
      queue = createPrivacyQueue(t.boss);
    const deps = createPrivacyIntegrationDeps(t, {
      ...queue,
      extract: async (tx, job) => {
        await queue.extract(tx, job);
        throw new Error('Mất kết nối giả lập');
      },
    });
    await expect(
      approvePrivacy(deps, {
        familyId: f.familyId,
        documentId: f.documentId,
        accountId: f.main.accountId,
        draftId: f.draftId,
        sha256: f.sha256,
        confirmed: true,
      }),
    ).rejects.toThrow('Mất kết nối giả lập');
    expect(
      (
        await t.owner.query('SELECT status,privacy_approved_at FROM source_documents WHERE id=$1', [
          f.documentId,
        ])
      ).rows[0],
    ).toEqual({ status: 'awaiting_privacy', privacy_approved_at: null });
    expect(
      (
        await t.owner.query(
          "SELECT count(*)::int n FROM pgboss.job WHERE name='extract-document' AND data->>'documentId'=$1",
          [f.documentId],
        )
      ).rows[0].n,
    ).toBe(0);
  });
  it('TC-170b: consent và key/draft đổi sau khi đọc S3 đều chặn OCR', async () => {
    for (const change of ['consent', 'key', 'draft']) {
      const f = await ready(),
        queue = createPrivacyQueue(t.boss);
      const deps = createPrivacyIntegrationDeps(t, queue, async () => {
        if (change === 'consent')
          await t.owner.query("UPDATE health_profiles SET consent_status='pending' WHERE id=$1", [
            f.profile.id,
          ]);
        if (change === 'key')
          await t.owner.query('UPDATE source_documents SET ocr_image_key=$1 WHERE id=$2', [
            f.key + '.changed',
            f.documentId,
          ]);
        if (change === 'draft')
          await t.owner.query('UPDATE source_documents SET privacy_draft_id=$1 WHERE id=$2', [
            randomUUID(),
            f.documentId,
          ]);
      });
      expect(
        await approvePrivacy(deps, {
          familyId: f.familyId,
          documentId: f.documentId,
          accountId: f.main.accountId,
          draftId: f.draftId,
          sha256: f.sha256,
          confirmed: true,
        }),
      ).toMatchObject({ ok: false });
      expect(
        (
          await t.owner.query(
            "SELECT count(*)::int n FROM pgboss.job WHERE name='extract-document' AND data->>'documentId'=$1",
            [f.documentId],
          )
        ).rows[0].n,
      ).toBe(0);
    }
  });
});
