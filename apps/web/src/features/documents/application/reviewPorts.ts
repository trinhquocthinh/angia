import type { DocumentDeletionImpact } from '@angia/contracts';
import type { components } from '@src/shared/api/schema.gen';

export type SourceDocument = components['schemas']['SourceDocument'];
type DocumentReview = components['schemas']['DocumentReview'];
type ExtractionPayload = NonNullable<DocumentReview['extraction']>;
export type DeviceReadingPayload = Extract<ExtractionPayload, { type: 'device_reading' }>;
export type PrescriptionPayload = Extract<ExtractionPayload, { type: 'prescription' }>;
// Bản trích xuất AI chỉ có 4 buổi; bản duyệt thêm "Khi cần" (BR-025 2026-10-12).
export type DailyDoseSlot = PrescriptionPayload['items'][number]['slots'][number];
export type ApproveDocumentRequest = components['schemas']['ApproveDocumentRequest'];
export type PrescriptionApproval = Extract<ApproveDocumentRequest, { type: 'prescription' }>['data'];
export type DoseSlot = PrescriptionApproval['items'][number]['slots'][number];
export type LabResultPayload = Extract<ExtractionPayload, { type: 'lab_result' }>;
export type LabResultApproval = Extract<ApproveDocumentRequest, { type: 'lab_result' }>['data'];
type ApprovedDocument = components['schemas']['ApprovedDocumentResponse'];
type ManualRecords = components['schemas']['ManualRecordsResponse'];
type SourceDocumentPage = components['schemas']['SourceDocumentPage'];

export interface ReviewRepository {
  /** F09a: một trang hàng đợi; `cursor` là id chứng từ cuối trang trước. */
  queue(cursor: string | null, signal?: AbortSignal): Promise<SourceDocumentPage>;
  review(id: string, signal?: AbortSignal): Promise<DocumentReview>;
  deletionImpact(id: string, signal?: AbortSignal): Promise<DocumentDeletionImpact>;
  deleteDocument(id: string, csrfToken: string): Promise<void>;
  approve(id: string, body: ApproveDocumentRequest, csrfToken: string): Promise<ApprovedDocument>;
  /** SPEC-011: nhập trực tiếp không kèm ảnh, bản ghi gắn cờ manualWithoutSource. */
  createManualRecords(
    profileId: string,
    body: ApproveDocumentRequest,
    csrfToken: string,
  ): Promise<ManualRecords>;
}
