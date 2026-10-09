import type { components } from '@src/shared/api/schema.gen';

export type SourceDocument = components['schemas']['SourceDocument'];
type DocumentReview = components['schemas']['DocumentReview'];
type ExtractionPayload = NonNullable<DocumentReview['extraction']>;
export type DeviceReadingPayload = Extract<ExtractionPayload, { type: 'device_reading' }>;
export type PrescriptionPayload = Extract<ExtractionPayload, { type: 'prescription' }>;
export type DoseSlot = PrescriptionPayload['items'][number]['slots'][number];
export type ApproveDocumentRequest = components['schemas']['ApproveDocumentRequest'];
type ApprovedDocument = components['schemas']['ApprovedDocumentResponse'];

export interface ReviewRepository {
  queue(signal?: AbortSignal): Promise<SourceDocument[]>;
  review(id: string, signal?: AbortSignal): Promise<DocumentReview>;
  approve(id: string, body: ApproveDocumentRequest, csrfToken: string): Promise<ApprovedDocument>;
}
