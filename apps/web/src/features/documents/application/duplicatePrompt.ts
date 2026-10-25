import type { ApproveDocumentRequest } from './reviewPorts';
import type { DuplicateRecord, ReviewRequestError } from './ReviewRequestError';

export interface DuplicatePrompt {
  record: DuplicateRecord;
  type: ApproveDocumentRequest['type'];
  /** Đúng lệnh vừa gửi, thêm xác nhận chủ ý lưu thêm. */
  request: ApproveDocumentRequest;
}

// SPEC-012: lỗi trùng không hiện như lỗi form mà thành câu hỏi "Vẫn lưu bản này".
export function duplicatePrompt(
  error: ReviewRequestError | null,
  lastRequest: ApproveDocumentRequest | null,
): { formError: ReviewRequestError | null; prompt: DuplicatePrompt | null } {
  const record = error?.code === 'ERR_DUPLICATE_UNCONFIRMED' ? error.duplicate : null;
  if (!record || !lastRequest) return { formError: error, prompt: null };
  return {
    formError: null,
    prompt: { record, type: lastRequest.type, request: { ...lastRequest, confirmDuplicate: true } },
  };
}
