import { describe, expect, it } from 'vitest';
import { extractDocumentJobSchema } from './extractDocumentJob.js';

const documentId = '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5b';
const familyId = '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5c';

describe('Job extract-document (SPEC-009)', () => {
  it('nhận đúng cặp documentId + familyId dạng UUID', () => {
    expect(extractDocumentJobSchema.parse({ documentId, familyId })).toEqual({ documentId, familyId });
  });

  it('từ chối payload thiếu familyId hoặc ID không phải UUID', () => {
    expect(extractDocumentJobSchema.safeParse({ documentId }).success).toBe(false);
    expect(extractDocumentJobSchema.safeParse({ documentId: 'abc', familyId }).success).toBe(false);
  });
});
