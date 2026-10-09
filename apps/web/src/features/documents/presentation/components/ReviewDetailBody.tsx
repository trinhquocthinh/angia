import type { components } from '@src/shared/api/schema.gen';
import type { ApproveDocumentRequest, SourceDocument } from '../../application/reviewPorts';
import type { ReviewRequestError } from '../../application/ReviewRequestError';
import { reviewItemState } from '../../application/reviewQueuePolling';
import { ExtractingPlaceholder } from './ExtractingPlaceholder';
import { LabResultForm } from './LabResultForm';
import { ManualEntryForm } from './ManualEntryForm';
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
      <ManualEntryForm
        key={document.id}
        initialType={document.type}
        intro="Chứng từ này cần nhập tay. Chọn loại dữ liệu rồi nhập theo ảnh; ảnh không dùng được thì có thể loại bỏ."
        pending={pending}
        error={error}
        onSubmit={onSubmit}
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
  if (document.type === 'lab_result')
    return (
      <LabResultForm
        key={document.id}
        payload={extraction?.type === 'lab_result' ? extraction : null}
        pending={pending}
        error={error}
        onSubmit={onSubmit}
      />
    );
  const payload = extraction?.type === 'device_reading' ? extraction : null;
  return (
    <ReadingForm key={document.id} payload={payload} pending={pending} error={error} onSubmit={onSubmit} />
  );
}
