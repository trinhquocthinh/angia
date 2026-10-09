import type { components } from '@src/shared/api/schema.gen';
import type { ApproveDocumentRequest, SourceDocument } from '../../application/reviewPorts';
import type { ReviewRequestError } from '../../application/ReviewRequestError';
import { reviewItemState } from '../../application/reviewQueuePolling';
import { ExtractingPlaceholder } from './ExtractingPlaceholder';
import { PrescriptionForm } from './PrescriptionForm';
import { ReadingForm } from './ReadingForm';
import { ReviewNotice } from './ReviewNotice';
type DetailBodyProps = {
  document: SourceDocument;
  extraction: components['schemas']['DocumentReview']['extraction'];
  pending: boolean;
  error: ReviewRequestError | null;
  onSubmit: (request: ApproveDocumentRequest) => void;
};

export function ReviewDetailBody({ document, extraction, pending, error, onSubmit }: DetailBodyProps) {
  const state = reviewItemState(document);
  if (state === 'preparing')
    return (
      <ReviewNotice
        title="Đang chuẩn bị ảnh"
        body="Ảnh đang được chuyển đổi để bạn xem và kiểm tra trước khi OCR."
      />
    );
  if (state === 'reading') return <ExtractingPlaceholder />;
  if (state === 'manual')
    return (
      <ReviewNotice
        title="Cần nhập tay"
        body="Ảnh vẫn được lưu. Nhập tay theo ảnh sẽ có ở bản cập nhật sau; ảnh không dùng được thì có thể loại bỏ."
      />
    );
  if (document.status !== 'pending_review')
    return <ReviewNotice title="Chứng từ không còn chờ duyệt" body="Chứng từ này đã được xử lý trước đó." />;
  if (document.type === 'prescription')
    return (
      <PrescriptionForm
        key={document.id}
        payload={extraction?.type === 'prescription' ? extraction : null}
        pending={pending}
        error={error}
        onSubmit={onSubmit}
      />
    );
  if (document.type !== 'device_reading')
    return (
      <ReviewNotice
        title="Sẽ duyệt được ở bản cập nhật sau"
        body="Hiện chưa duyệt được kết quả xét nghiệm. Chứng từ vẫn được giữ trong hàng đợi."
      />
    );
  const payload = extraction?.type === 'device_reading' ? extraction : null;
  return (
    <ReadingForm key={document.id} payload={payload} pending={pending} error={error} onSubmit={onSubmit} />
  );
}
