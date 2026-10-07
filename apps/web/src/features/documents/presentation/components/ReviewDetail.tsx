import { Link, useNavigate } from '@tanstack/react-router';
import type { components } from '@src/shared/api/schema.gen';
import { nextDocumentId } from '../../application/reviewQueue';
import type { ApproveDocumentRequest, ReviewRepository, SourceDocument } from '../../application/reviewPorts';
import { ReviewRequestError } from '../../application/ReviewRequestError';
import { useApproveDocument, useDocumentReview } from '../../application/useReviewWorkspace';
import { DocumentImagePanel } from './DocumentImagePanel';
import { ReadingForm } from './ReadingForm';
import { ReviewNotice } from './ReviewNotice';

type ReviewDetailProps = {
  repository: ReviewRepository;
  session: components['schemas']['MeContextResponse'];
  documentId: string;
  queue: SourceDocument[];
  profileNames: Map<string, string>;
};

// Design §6 `/review/:id`: ảnh phía trên (desktop bên trái), form đối soát, lưu xong sang chứng từ kế tiếp.
export function ReviewDetail({ repository, session, documentId, queue, profileNames }: ReviewDetailProps) {
  const navigate = useNavigate();
  const review = useDocumentReview(repository, session, documentId);
  const approve = useApproveDocument(repository, session, documentId);
  if (review.isPending)
    return (
      <div
        role="status"
        className="h-[480px] animate-pulse rounded-[20px] bg-white motion-reduce:animate-none"
        aria-label="Đang tải chứng từ"
      />
    );
  if (review.isError)
    return (
      <ReviewNotice
        title="Không mở được chứng từ"
        body="Chứng từ không tồn tại hoặc bạn không có quyền xem."
      />
    );
  const { document, extraction } = review.data;
  const save = (request: ApproveDocumentRequest) => {
    const next = nextDocumentId(queue, documentId);
    approve.mutate(request, {
      onSuccess: () =>
        void (next
          ? navigate({ to: '/review/$documentId', params: { documentId: next } })
          : navigate({ to: '/review' })),
    });
  };
  const profileName = profileNames.get(document.healthProfileId) ?? 'Hồ sơ';
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link to="/review" className="min-h-11 content-center text-sm font-medium text-[#286958] lg:hidden">
          ← Chờ duyệt
        </Link>
        <h2 className="text-xl font-semibold text-[#004135]">Số đo của {profileName}</h2>
      </div>
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <DocumentImagePanel document={document} />
        <DetailBody
          document={document}
          extraction={extraction}
          pending={approve.isPending}
          error={approve.error instanceof ReviewRequestError ? approve.error : null}
          onSubmit={save}
        />
      </div>
    </div>
  );
}

type DetailBodyProps = {
  document: SourceDocument;
  extraction: components['schemas']['DocumentReview']['extraction'];
  pending: boolean;
  error: ReviewRequestError | null;
  onSubmit: (request: ApproveDocumentRequest) => void;
};

function DetailBody({ document, extraction, pending, error, onSubmit }: DetailBodyProps) {
  if (document.status !== 'pending_review')
    return <ReviewNotice title="Chứng từ không còn chờ duyệt" body="Chứng từ này đã được xử lý trước đó." />;
  if (document.type !== 'device_reading')
    return (
      <ReviewNotice
        title="Sẽ duyệt được ở bản cập nhật sau"
        body="Hiện mới duyệt được ảnh màn hình máy đo huyết áp/đường huyết. Đơn thuốc và kết quả xét nghiệm vẫn được giữ trong hàng đợi."
      />
    );
  const payload = extraction?.type === 'device_reading' ? extraction : null;
  return (
    <ReadingForm key={document.id} payload={payload} pending={pending} error={error} onSubmit={onSubmit} />
  );
}
