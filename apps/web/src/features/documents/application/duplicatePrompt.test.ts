import { describe, expect, it } from 'vitest';
import { duplicatePrompt } from './duplicatePrompt';
import type { ApproveDocumentRequest } from './reviewPorts';
import { ReviewRequestError } from './ReviewRequestError';

const record = {
  duplicateOf: 'doc-1',
  recordDate: '2026-10-01',
  facility: null,
  savedAt: '2026-10-02T00:00:00Z',
};
const request = {
  type: 'lab_result',
  data: { type: 'lab_result', resultDate: '2026-10-01', facility: null, items: [] },
} as ApproveDocumentRequest;
const duplicateError = (duplicate = record) =>
  new ReviewRequestError('Trùng', 409, 'ERR_DUPLICATE_UNCONFIRMED', [], [], duplicate);

describe('Hỏi chủ ý lưu thêm khi trùng (SPEC-012, BR-017)', () => {
  it('lỗi trùng → không báo lỗi trong form, đề xuất gửi lại đúng lệnh vừa gửi kèm confirmDuplicate', () => {
    expect(duplicatePrompt(duplicateError(), request)).toEqual({
      formError: null,
      prompt: { record, type: 'lab_result', request: { ...request, confirmDuplicate: true } },
    });
  });

  it('lỗi khác hoặc chi tiết trùng hỏng → form tự báo lỗi như cũ', () => {
    const other = new ReviewRequestError('Thiếu ngày', 422, 'ERR_DOCUMENT_DATE_REQUIRED');
    expect(duplicatePrompt(other, request)).toEqual({ formError: other, prompt: null });
    const broken = new ReviewRequestError('Trùng', 409, 'ERR_DUPLICATE_UNCONFIRMED');
    expect(duplicatePrompt(broken, request)).toEqual({ formError: broken, prompt: null });
    expect(duplicatePrompt(null, null)).toEqual({ formError: null, prompt: null });
  });
});
