import { useState } from 'react';
import type { components } from '@src/shared/api/schema.gen';
import type { ReviewRepository } from '../../application/reviewPorts';
import { useRejectDocument } from '../../application/useReviewWorkspace';

type RejectDocumentControlProps = {
  repository: ReviewRepository;
  session: components['schemas']['MeContextResponse'];
  documentId: string;
  onRejected: () => void;
};

// Loại bỏ chứng từ (BR §3.1): hai bước để tránh bấm nhầm; ảnh gốc vẫn được giữ.
export function RejectDocumentControl({
  repository,
  session,
  documentId,
  onRejected,
}: RejectDocumentControlProps) {
  const reject = useRejectDocument(repository, session, documentId);
  const [confirming, setConfirming] = useState(false);
  const pending = reject.isPending;
  const error = reject.error ? reject.error.message : null;
  const onReject = () => reject.mutate(undefined, { onSuccess: onRejected });
  if (!confirming)
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="self-start min-h-11 rounded-xl px-4 text-sm font-semibold text-[#b42318] hover:bg-[#fdecea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
      >
        Loại bỏ chứng từ
      </button>
    );
  return (
    <div
      role="alertdialog"
      aria-labelledby="reject-title"
      className="flex flex-col gap-3 rounded-2xl bg-[#fdecea] p-4"
    >
      <p id="reject-title" className="text-sm text-[#5c1a12]">
        Loại bỏ chứng từ này? Chứng từ sẽ rời hàng đợi và không đưa dữ liệu nào vào sổ. Ảnh gốc vẫn được giữ.
      </p>
      {error && (
        <p role="alert" className="text-sm font-medium text-[#b42318]">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={onReject}
          className="min-h-11 rounded-xl bg-[#b42318] px-4 text-sm font-semibold text-white disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
        >
          {pending ? 'Đang loại bỏ…' : 'Loại bỏ'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => setConfirming(false)}
          className="min-h-11 rounded-xl bg-white px-4 text-sm font-semibold text-[#004135] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958]"
        >
          Giữ lại
        </button>
      </div>
    </div>
  );
}
