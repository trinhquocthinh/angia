import { randomUUID } from 'node:crypto';
import { pino } from 'pino';
import { expect, it, vi } from 'vitest';
import { createMemorySanitizeDeps } from '@src/shared/test/createMemorySanitizeDeps.test-helper.js';
import { handleSanitizeDocumentImageJob } from './handleSanitizeDocumentImageJob.js';

it('TC-416: handler từ chối payload sai trước S3 và không log raw lỗi hạ tầng', async () => {
  const f = createMemorySanitizeDeps();
  const logger = pino({ level: 'silent' });
  const warn = vi.spyOn(logger, 'warn');
  const handler = handleSanitizeDocumentImageJob(f.deps, logger);
  await expect(handler({ id: 'job', data: {}, retryCount: 0, retryLimit: 2 })).rejects.toThrow();
  expect(f.deps.storage.get).not.toHaveBeenCalled();
  f.deps.repository.withFamily = async () => {
    throw new Error('private database details');
  };
  await expect(
    handler({
      id: 'job',
      data: { familyId: randomUUID(), documentId: randomUUID() },
      retryCount: 2,
      retryLimit: 2,
    }),
  ).rejects.toThrow('private database details');
  expect(warn).toHaveBeenCalledWith(
    { jobId: 'job', retryCount: 2, finalAttempt: true, reason: 'sanitize_failed' },
    expect.any(String),
  );
});
