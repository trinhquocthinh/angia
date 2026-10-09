import type { components } from '@src/shared/api/schema.gen';

export type SourceDocument = components['schemas']['SourceDocument'];
type DocumentReview = components['schemas']['DocumentReview'];
type ExtractionPayload = NonNullable<DocumentReview['extraction']>;
export type DeviceReadingPayload = Extract<ExtractionPayload, { type: 'device_reading' }>;
export type PrescriptionPayload = Extract<ExtractionPayload, { type: 'prescription' }>;
export type DoseSlot = PrescriptionPayload['items'][number]['slots'][number];
export type ApproveDocumentRequest = components['schemas']['ApproveDocumentRequest'];
export type PrescriptionApproval = Extract<ApproveDocumentRequest, { type: 'prescription' }>['data'];
type ApprovedDocument = components['schemas']['ApprovedDocumentResponse'];
type SourceDocumentPage = components['schemas']['SourceDocumentPage'];

export interface ReviewRepository {
  /** F09a: một trang hàng đợi; `cursor` là id chứng từ cuối trang trước. */
  queue(cursor: string | null, signal?: AbortSignal): Promise<SourceDocumentPage>;
  review(id: string, signal?: AbortSignal): Promise<DocumentReview>;
  approve(id: string, body: ApproveDocumentRequest, csrfToken: string): Promise<ApprovedDocument>;
  reject(id: string, csrfToken: string): Promise<SourceDocument>;
}
