import type { OcrImageApproval } from './canUseApprovedOcrImage.js';
export type DocumentType = 'prescription' | 'lab_result' | 'device_reading';
type DocumentStatus =
  | 'uploaded'
  | 'awaiting_privacy'
  | 'extracting'
  | 'pending_review'
  | 'approved'
  | 'rejected'
  | 'manual_entry'
  | 'awaiting_budget';

// Chứng từ worker cần để trích xuất; không chứa định danh hồ sơ gửi được sang AI (Tech Spec §5.2).
export interface DocumentToExtract extends OcrImageApproval {
  id: string;
  status: DocumentStatus;
  declaredType: DocumentType | null;
  originalKey: string;
  previewKey: string | null;
  mimeType: string;
}

// Hình dạng tối thiểu của payload SDD §2.1 mà domain cần đánh giá; hợp đồng đầy đủ nằm ở packages/contracts.
export type ExtractedContent =
  | { type: 'prescription' | 'lab_result'; items: readonly unknown[] }
  | {
      type: 'device_reading';
      systolic: number | null;
      diastolic: number | null;
      pulse: number | null;
      glucoseValue: number | null;
    };

export type ExtractionVerdict = { usable: true } | { usable: false; reason: 'empty' | 'type_mismatch' };
