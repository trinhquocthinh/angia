import { useState } from 'react';
import { duplicatePrompt } from './duplicatePrompt';
import type { ApproveDocumentRequest } from './reviewPorts';
import type { ReviewRequestError } from './ReviewRequestError';

// Nhớ lệnh lưu gần nhất để "Vẫn lưu bản này" gửi lại đúng dữ liệu đó kèm confirmDuplicate.
export function useDuplicatePrompt(
  send: (request: ApproveDocumentRequest) => void,
  error: ReviewRequestError | null,
) {
  const [lastRequest, setLastRequest] = useState<ApproveDocumentRequest | null>(null);
  const submit = (request: ApproveDocumentRequest) => {
    setLastRequest(request);
    send(request);
  };
  return { submit, ...duplicatePrompt(error, lastRequest) };
}
