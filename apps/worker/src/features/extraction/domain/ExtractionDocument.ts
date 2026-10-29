import type { ImageApproval } from './canUseApprovedImage.js';
export type DocumentType = 'prescription' | 'lab_result' | 'device_reading';
type DocumentStatus =
  'uploaded' | 'extracting' | 'pending_review' | 'approved' | 'manual_entry' | 'awaiting_budget';

// Chứng từ worker cần để trích xuất; không chứa định danh hồ sơ gửi được sang AI (Tech Spec §5.2).
export interface DocumentToExtract extends ImageApproval {
  id: string;
  status: DocumentStatus;
  declaredType: DocumentType | null;
  /** Hồ sơ còn `confirmed`; false (vd. đã rút đồng thuận) thì không được gửi ảnh sang AI. */
  profileConsentConfirmed: boolean;
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
