import { useNavigate } from '@tanstack/react-router';
import type { ReactNode } from 'react';
import type { components } from '@src/shared/api/schema.gen';
import '@src/shared/ui/modal-motion.css';
import { nextDocumentId } from '../../application/reviewQueue';
import { reviewItemState } from '../../application/reviewQueuePolling';
import type { ReviewRepository, SourceDocument } from '../../application/reviewPorts';
import { useDocumentReview } from '../../application/useReviewWorkspace';
import { DocumentImagePanel } from './DocumentImagePanel';
import { ReviewNotice } from './ReviewNotice';
import { ReviewDetailHeading } from './ReviewDetailHeading';
import { ReviewFormColumn } from './ReviewFormColumn';
import { ReviewLoading } from './ReviewLoading';

type ReviewDetailProps = {
  repository: ReviewRepository;
  session: components['schemas']['MeContextResponse'];
  documentId: string;
  queue: SourceDocument[];
  profileNames: Map<string, string>;
  queuePanel: ReactNode;
};

// Lưu xong thì sang chứng từ kế tiếp; hết hàng đợi thì về danh sách.
function useGoToNextDocument(queue: SourceDocument[], documentId: string) {
  const navigate = useNavigate();
  return () => {
    const next = nextDocumentId(queue, documentId);
    void (next
      ? navigate({ to: '/review/$documentId', params: { documentId: next } })
      : navigate({ to: '/review' }));
  };
}

// Design §6 `/review/:id`: ảnh phía trên (desktop bên trái), form đối soát, lưu xong sang chứng từ kế tiếp.
export function ReviewDetail({
  repository,
  session,
  documentId,
  queue,
  profileNames,
  queuePanel,
}: ReviewDetailProps) {
  const goNext = useGoToNextDocument(queue, documentId);
  const review = useDocumentReview(repository, session, documentId);
  if (review.isPending)
    return (
      <div className="review-detail-grid">
        <div className="review-detail-queue">{queuePanel}</div>
        <ReviewLoading />
      </div>
    );
  if (review.isError)
    return (
      <div className="review-detail-grid">
        <div className="review-detail-queue">{queuePanel}</div>
        <ReviewNotice
          title="Không mở được giấy tờ"
          body="Giấy tờ không tồn tại hoặc bạn không có quyền xem."
        />
      </div>
    );
  const { document, extraction } = review.data;
  const profileName = profileNames.get(document.healthProfileId) ?? 'Hồ sơ';
  const position = queue.findIndex((item) => item.id === document.id);
  return (
    <div key={document.id} className="angia-modal-reveal flex flex-col gap-4">
      <ReviewDetailHeading
        profileName={profileName}
        state={reviewItemState(document)}
        position={position >= 0 ? { index: position + 1, total: queue.length } : null}
      />
      <div className="review-detail-grid">
        <div className="review-document-column">
          <div className="review-detail-queue">{queuePanel}</div>
          <DocumentImagePanel key={`${document.id}:${document.status}`} document={document} />
        </div>
        <div className="review-form-column">
          <ReviewFormColumn
            key={document.id}
            {...{ repository, session, document, extraction }}
            onDone={goNext}
          />
        </div>
      </div>
    </div>
  );
}
