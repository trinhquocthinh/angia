import { describe, expect, it } from 'vitest';
import { pino } from 'pino';
import { createMemoryExtractionDeps } from '@src/shared/test/createMemoryExtractionDeps.js';
import { handleExtractDocumentJob } from './handleExtractDocumentJob.js';

const logger = pino({ level: 'silent' });
const data = {
  documentId: '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5b',
  familyId: '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5c',
};
const job = (retryCount: number) => ({ id: 'job-1', data, retryCount, retryLimit: 2 });
const deps = (result: Error) => createMemoryExtractionDeps({ result, ...data });

describe('Job extract-document trên pg-boss', () => {
  it('lỗi gọi AI trước lần cuối được ném lại để pg-boss thử lại', async () => {
    const memory = deps(new Error('HTTP 500'));
    await expect(handleExtractDocumentJob(memory.deps, logger)(job(1))).rejects.toThrow('HTTP 500');
    expect(memory.statusHistory).toEqual(['extracting']);
  });

  it('lần thử thứ 3 (retryCount = retryLimit) lỗi tiếp → manual_entry, không ném lỗi', async () => {
    const memory = deps(new Error('HTTP 500'));
    expect(await handleExtractDocumentJob(memory.deps, logger)(job(2))).toMatchObject({
      status: 'manual_entry',
    });
    expect(memory.statusHistory).toEqual(['extracting', 'manual_entry']);
  });

  it('TC-109: log retry không chứa nội dung lỗi riêng tư nhưng vẫn ném lại lỗi', async () => {
    const marker = 'SYNTHETIC_PRIVATE_PATIENT';
    const memory = deps(new Error(marker));
    const logs: string[] = [];
    const log = pino({}, { write: (chunk: string) => logs.push(chunk) });
    await expect(handleExtractDocumentJob(memory.deps, log)(job(1))).rejects.toThrow(marker);
    expect(logs.join('')).not.toContain(marker);
    expect(JSON.parse(logs[0]!)).toMatchObject({
      jobId: 'job-1',
      documentId: data.documentId,
      retryCount: 1,
    });
  });

  it('payload job sai hợp đồng bị từ chối trước khi chạm DB', async () => {
    const memory = deps(new Error('không được gọi'));
    const handler = handleExtractDocumentJob(memory.deps, logger);
    await expect(handler({ ...job(0), data: { documentId: 'x' } })).rejects.toThrow();
    expect(memory.extractorCalls).toEqual([]);
  });
});
