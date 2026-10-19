import { useEffect } from 'react';
import { useNavigate } from '@tanstack/react-router';
import type { summarizeQueue } from './uploadQueue';

// Gửi hết, không lỗi → mở thẳng chứng từ đầu tiên vừa gửi (ảnh hiện ngay, form tự hiện khi AI đọc xong).
export function useOpenUploadedDocument(summary: ReturnType<typeof summarizeQueue>) {
  const navigate = useNavigate();
  const finished = summary.done > 0 && summary.total === summary.done;
  useEffect(() => {
    if (!finished) return;
    const state = { uploadedCount: summary.done };
    void (summary.firstDocumentId
      ? navigate({ to: '/review/$documentId', params: { documentId: summary.firstDocumentId }, state })
      : navigate({ to: '/review', state }));
  }, [finished, navigate, summary.done, summary.firstDocumentId]);
}
