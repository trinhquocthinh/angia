import { createHash } from 'node:crypto';
import { PREPARE_OCR_IMAGE_QUEUE } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import { pino } from 'pino';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { PrivacyDependencies } from '@src/features/documentPrivacy/application/ports.js';
import { prepareOcrImage } from '@src/features/documentPrivacy/application/prepareOcrImage.js';
import { createPrivacyRepository } from '@src/features/documentPrivacy/infrastructure/createPrivacyRepository.js';
import { createPrivacyPgFixture } from '@src/shared/test/createPrivacyPgFixture.js';
import { createPgBoss } from '@src/shared/queue/createPgBoss.js';
import { handlePrepareOcrImageJob } from './handlePrepareOcrImageJob.js';
import { registerPrepareOcrImageJob } from './registerPrepareOcrImageJob.js';
const logger = pino({ level: 'silent' });
const edits = {
  rotation: 0 as const,
  crop: { left: 0, top: 0, width: 1_000_000, height: 1_000_000 },
  masks: [],
};
describe('Worker tạo bản kiểm tra trên PostgreSQL thật với role NOBYPASSRLS', () => {
  let fixture: Awaited<ReturnType<typeof createPrivacyPgFixture>>;
  let boss: PgBoss;
  const objects = new Map<string, Uint8Array>();
  const deps = (): PrivacyDependencies => ({
    repository: createPrivacyRepository(fixture.pool),
    newId: () => crypto.randomUUID(),
    images: { toPng: async () => new Uint8Array([2, 3]) },
    storage: {
      get: async () => new Uint8Array([1]),
      put: async (key, bytes) => {
        objects.set(key, bytes);
      },
      delete: async (key) => {
        objects.delete(key);
      },
    },
  });
  const state = async (id: string) =>
    (
      await fixture.owner.query(
        `SELECT status,privacy_draft_status AS draft,ocr_image_key AS key,ocr_image_sha256 AS hash FROM source_documents WHERE id=$1`,
        [id],
      )
    ).rows[0];
  beforeAll(async () => {
    fixture = await createPrivacyPgFixture();
    boss = createPgBoss(fixture.appUrl, logger);
    await boss.start();
  });
  afterAll(async () => {
    await boss?.stop({ graceful: false });
    await fixture?.close();
  });
  it('TC-197: pg-boss thật render ready, SHA đúng; RLS khác family và job lặp không thay đổi kết quả', async () => {
    const own = await fixture.seed();
    const other = await fixture.seed();
    expect(
      await prepareOcrImage(deps(), { ...own, familyId: other.familyId, edits, finalAttempt: false }),
    ).toEqual({ status: 'skipped' });
    await registerPrepareOcrImageJob(boss, handlePrepareOcrImageJob(deps(), logger));
    await boss.send(PREPARE_OCR_IMAGE_QUEUE, { ...own, edits });
    await expect
      .poll(() => state(own.documentId), { timeout: 15000, interval: 100 })
      .toMatchObject({
        status: 'awaiting_privacy',
        draft: 'ready',
        hash: createHash('sha256')
          .update(new Uint8Array([2, 3]))
          .digest('hex'),
      });
    const ready = await state(own.documentId);
    expect(ready.key).toContain(`/ocr/${own.draftId}/`);
    expect(objects.has(ready.key)).toBe(true);
    expect(await prepareOcrImage(deps(), { ...own, edits, finalAttempt: false })).toEqual({
      status: 'skipped',
    });
    expect(await state(own.documentId)).toEqual(ready);
    expect(await state(other.documentId)).toMatchObject({ draft: 'pending', key: null });
  });
  it('TC-198: CAS thua manual_entry thật dọn object riêng, không giữ transaction lúc encode', async () => {
    const own = await fixture.seed();
    const dependencies = deps();
    let removed: string | null = null;
    dependencies.images.toPng = async () => {
      expect(
        (
          await fixture.owner.query(
            `SELECT count(*)::int AS count FROM pg_stat_activity WHERE usename=$1 AND state='idle in transaction'`,
            ['angia_privacy_worker_app'],
          )
        ).rows[0].count,
      ).toBe(0);
      await fixture.owner.query(`UPDATE source_documents SET status='manual_entry' WHERE id=$1`, [
        own.documentId,
      ]);
      return new Uint8Array([2, 3]);
    };
    dependencies.storage.delete = async (key) => {
      removed = key;
      objects.delete(key);
    };
    expect(await prepareOcrImage(dependencies, { ...own, edits, finalAttempt: false })).toEqual({
      status: 'skipped',
    });
    expect(removed).toMatch(/\.png$/);
    expect(await state(own.documentId)).toMatchObject({
      status: 'manual_entry',
      draft: 'pending',
      key: null,
    });
  });
  it('TC-199: CAS chỉ draft hiện hành pending, ready/failed/khác nhóm không bị ghi đè', async () => {
    const own = await fixture.seed();
    const other = await fixture.seed();
    const repository = createPrivacyRepository(fixture.pool);
    expect(
      await repository.withFamily(other.familyId, (store) => store.markFailed(own.documentId, own.draftId)),
    ).toBe(false);
    expect(
      await repository.withFamily(own.familyId, (store) =>
        store.markFailed(own.documentId, crypto.randomUUID()),
      ),
    ).toBe(false);
    expect(
      await repository.withFamily(own.familyId, (store) => store.markFailed(own.documentId, own.draftId)),
    ).toBe(true);
    expect(
      await repository.withFamily(own.familyId, (store) =>
        store.saveReady(own.documentId, own.draftId, 'never', 'a'.repeat(64)),
      ),
    ).toBe(false);
    expect(await state(own.documentId)).toMatchObject({
      status: 'awaiting_privacy',
      draft: 'failed',
      key: null,
    });
  });
});
