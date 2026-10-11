import { useState } from 'react';
import type { ApproveDocumentRequest } from '@src/features/documents/application/reviewPorts';
import type { ReviewRequestError } from '@src/features/documents/application/ReviewRequestError';
import { courseConflictPrompt } from './courseConflictPrompt';

// Giữ đúng bản đã gửi, kể cả confirmDuplicate; không lấy lại dữ liệu đang sửa khi xác nhận.
export function useCourseConflictPrompt(
  send: (request: ApproveDocumentRequest) => void,
  error: ReviewRequestError | null,
) {
  const [lastRequest, setLastRequest] = useState<ApproveDocumentRequest | null>(null);
  const submit = (request: ApproveDocumentRequest) => {
    setLastRequest(structuredClone(request));
    send(request);
  };
  return { submit, ...courseConflictPrompt(error, lastRequest) };
}
