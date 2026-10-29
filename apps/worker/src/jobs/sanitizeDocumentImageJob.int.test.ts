import {
  EXTRACT_DOCUMENT_QUEUE,
  SANITIZE_DOCUMENT_IMAGE_QUEUE,
  ensureExtractDocumentQueues,
} from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import { pino } from 'pino';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { ImageConversionError } from '@src/features/extraction/application/ImageConversionError.js';
import { sanitizeDocumentImage } from '@src/features/documentSanitize/application/sanitizeDocumentImage.js';
import type { SanitizeDependencies } from '@src/features/documentSanitize/application/ports.js';
import { createSanitizeRepository } from '@src/features/documentSanitize/infrastructure/createSanitizeRepository.js';
import { createSanitizePgFixture } from '@src/shared/test/createSanitizePgFixture.test-helper.js';
import { createPgBoss } from '@src/shared/queue/createPgBoss.js';
import { handleSanitizeDocumentImageJob } from './handleSanitizeDocumentImageJob.js';
import { registerSanitizeDocumentImageJob } from './registerSanitizeDocumentImageJob.js';

describe('Làm sạch JPEG với PostgreSQL và pg-boss thật, role NOBYPASSRLS', () => {
  let f: Awaited<ReturnType<typeof createSanitizePgFixture>>;
  let boss: PgBoss;
  const logger = pino({ level: 'silent' });
  const objects = new Map<string, Uint8Array>();
  const deps = (): SanitizeDependencies => ({
    repository: createSanitizeRepository(f.pool, boss),
    newId: () => crypto.randomUUID(),
    images: { sanitize: async () => ({ bytes: new Uint8Array([2, 3]), sha256: 'a'.repeat(64) }) },
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
      await f.owner.query(
        `SELECT status,image_key AS key,image_sha256 AS hash,size_bytes AS size FROM source_documents WHERE id=$1`,
        [id],
      )
    ).rows[0];
  const purges = async (key: string) =>
    (await f.owner.query('SELECT object_key FROM object_purges WHERE object_key=$1', [key])).rows;
  const jobs = async (id: string) =>
    (
      await f.owner.query(`SELECT data FROM pgboss.job WHERE name=$1 AND data->>'documentId'=$2`, [
        EXTRACT_DOCUMENT_QUEUE,
        id,
      ])
    ).rows;
  beforeAll(async () => {
    f = await createSanitizePgFixture();
    boss = createPgBoss(f.appUrl, logger);
    await boss.start();
    await ensureExtractDocumentQueues(boss);
  });
  afterAll(async () => {
    await boss?.stop({ graceful: false });
    await f?.close();
  });

  it('TC-416: job thật lưu ảnh/hash/size và enqueue OCR; tự nhập không enqueue, RLS và lặp an toàn', async () => {
    const own = await f.seed();
    const manual = await f.seed(false);
    const d = deps();
    expect(
      await sanitizeDocumentImage(d, { ...own, familyId: manual.familyId, finalAttempt: false }),
    ).toEqual({ status: 'skipped' });
    const repository = d.repository;
    expect(
      await repository.withFamily(manual.familyId, (s) => s.markUnusable(own.documentId, own.oldKey)),
    ).toBe(false);
    expect(
      await repository.withFamily(manual.familyId, (s) =>
        s.saveSanitized(own.documentId, {
          oldKey: own.oldKey,
          key: 'never',
          sha256: 'a'.repeat(64),
          sizeBytes: 2,
        }),
      ),
    ).toBeNull();
    await registerSanitizeDocumentImageJob(boss, handleSanitizeDocumentImageJob(d, logger));
    await boss.send(SANITIZE_DOCUMENT_IMAGE_QUEUE, own);
    await expect
      .poll(() => state(own.documentId), { timeout: 15_000, interval: 100 })
      .toMatchObject({ status: 'extracting', hash: 'a'.repeat(64), size: 2 });
    expect(await jobs(own.documentId)).toHaveLength(1);
    expect(await purges(own.oldKey)).toHaveLength(1);
    expect(await sanitizeDocumentImage(d, { ...own, finalAttempt: false })).toEqual({ status: 'skipped' });
    expect(await sanitizeDocumentImage(d, { ...manual, finalAttempt: false })).toEqual({
      status: 'manual_entry',
    });
    expect(await jobs(manual.documentId)).toHaveLength(0);
    expect(
      (await f.pool.query(`SELECT rolbypassrls FROM pg_roles WHERE rolname=current_user`)).rows[0]
        .rolbypassrls,
    ).toBe(false);
  });

  it.each(['error', 'null'])(
    'TC-416: enqueue %s rollback ảnh, hash, size, trạng thái và receipt khóa cũ',
    async (failure) => {
      const own = await f.seed();
      const d = deps();
      const spy = vi.spyOn(boss, 'send');
      if (failure === 'error') spy.mockRejectedValueOnce(new Error('extract_enqueue_failed'));
      else spy.mockResolvedValueOnce(null);
      try {
        await expect(sanitizeDocumentImage(d, { ...own, finalAttempt: false })).rejects.toThrow(
          'extract_enqueue_failed',
        );
        expect(await state(own.documentId)).toEqual({
          status: 'uploaded',
          key: own.oldKey,
          hash: null,
          size: 1,
        });
        expect(await purges(own.oldKey)).toHaveLength(0);
        expect(await jobs(own.documentId)).toHaveLength(0);
      } finally {
        spy.mockRestore();
      }
    },
  );

  it('TC-417: ảnh hỏng CAS về NULL, S3 lỗi vẫn có receipt và không enqueue', async () => {
    const own = await f.seed();
    const d = deps();
    d.images.sanitize = async () => {
      throw new ImageConversionError();
    };
    d.storage.delete = async () => {
      throw new Error('S3');
    };
    expect(await sanitizeDocumentImage(d, { ...own, finalAttempt: false })).toEqual({
      status: 'manual_entry',
      reason: 'image_unusable',
    });
    expect(await state(own.documentId)).toMatchObject({ status: 'manual_entry', key: null, hash: null });
    expect(await purges(own.oldKey)).toHaveLength(1);
    expect(await jobs(own.documentId)).toHaveLength(0);
  });

  it('TC-418: xóa chứng từ giữa encode không tạo OCR, khóa mới được dọn bền vững', async () => {
    const own = await f.seed();
    const d = deps();
    let written = '';
    d.images.sanitize = async () => {
      await f.owner.query('DELETE FROM source_documents WHERE id=$1', [own.documentId]);
      return { bytes: new Uint8Array([2, 3]), sha256: 'a'.repeat(64) };
    };
    d.storage.put = async (key, bytes) => {
      written = key;
      objects.set(key, bytes);
    };
    expect(await sanitizeDocumentImage(d, { ...own, finalAttempt: false })).toEqual({ status: 'skipped' });
    expect(objects.has(written)).toBe(false);
    expect(await purges(written)).toHaveLength(1);
    expect(await jobs(own.documentId)).toHaveLength(0);
  });
  it('TC-418: DB đã COMMIT nhưng mất phản hồi, giữ ảnh mới và đúng một job OCR', async () => {
    const own = await f.seed();
    const d = deps();
    const original = d.repository.withFamily;
    let calls = 0;
    d.repository.withFamily = async (family, work) => {
      const value = await original(family, work);
      if (++calls === 2) throw new Error('COMMIT response lost');
      return value;
    };
    expect(await sanitizeDocumentImage(d, { ...own, finalAttempt: false })).toEqual({ status: 'extracting' });
    const current = await state(own.documentId);
    expect(objects.has(current.key)).toBe(true);
    expect(await jobs(own.documentId)).toHaveLength(1);
    expect(await purges(own.oldKey)).toHaveLength(1);
    expect(await purges(current.key)).toHaveLength(0);
  });
});
