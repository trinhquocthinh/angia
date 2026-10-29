import { expect, it } from 'vitest';
import { sanitizeDocumentImageJobSchema } from './sanitizeDocumentImageJob.js';

it('TC-416: job làm sạch yêu cầu documentId và familyId dạng UUID', () => {
  const job = {
    documentId: '0199bc85-8918-7000-8000-000000000001',
    familyId: '0199bc85-8918-7000-8000-000000000002',
  };
  expect(sanitizeDocumentImageJobSchema.parse(job)).toEqual(job);
  for (const input of [
    {},
    { documentId: job.documentId },
    { familyId: job.familyId },
    { ...job, documentId: 'abc' },
    { ...job, familyId: 'abc' },
  ]) {
    expect(sanitizeDocumentImageJobSchema.safeParse(input).success).toBe(false);
  }
});
