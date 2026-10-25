import { PREPARE_OCR_IMAGE_QUEUE, PREPARE_OCR_IMAGE_QUEUE_OPTIONS } from '@angia/contracts';
import type { PgBoss } from 'pg-boss';
import { pino } from 'pino';
import { expect, it, vi } from 'vitest';
import { handlePrepareOcrImageJob } from './handlePrepareOcrImageJob.js';
import { registerPrepareOcrImageJob } from './registerPrepareOcrImageJob.js';
import {
  createPrivacyFixture,
  job,
} from '../features/documentPrivacy/application/createPrivacyFixture.test-helper.js';
it('TC-196: queue đăng ký metadata, một slot; payload sai không vào S3', async () => {
  const f = createPrivacyFixture();
  const handler = handlePrepareOcrImageJob(f.deps, pino({ level: 'silent' }));
  await expect(
    handler({ id: 'job', data: { ...job, key: 'forged' }, retryCount: 0, retryLimit: 2 }),
  ).rejects.toThrow();
  expect(f.deps.storage.get).not.toHaveBeenCalled();
  const boss = { createQueue: vi.fn(), work: vi.fn() };
  await registerPrepareOcrImageJob(boss as unknown as PgBoss, handler);
  expect(boss.createQueue).toHaveBeenCalledWith(PREPARE_OCR_IMAGE_QUEUE, PREPARE_OCR_IMAGE_QUEUE_OPTIONS);
  expect(boss.work).toHaveBeenCalledWith(
    PREPARE_OCR_IMAGE_QUEUE,
    { batchSize: 1, localConcurrency: 1, includeMetadata: true },
    expect.any(Function),
  );
});
