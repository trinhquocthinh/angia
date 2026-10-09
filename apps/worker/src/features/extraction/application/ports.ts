import type { DocumentToExtract, DocumentType, ExtractedContent } from '../domain/ExtractionDocument.js';

type SavedExtraction = {
  type: DocumentType;
  provider: string;
  model: string;
  /** Payload đầy đủ SDD §2.1 đã qua schema contracts; domain chỉ đọc phần ExtractedContent. */
  payload: ExtractedContent;
  costUsd: number;
};
/** Tháng ngân sách và tham số cấu hình của một lần giữ chỗ/quyết toán (BR-018). */
export interface BudgetCall {
  month: string;
  estimatedCostUsd: number;
  defaultMonthlyCapUsd: number;
}
export interface ExtractionStore {
  findDocument(id: string): Promise<DocumentToExtract | null>;
  markExtracting(id: string): Promise<void>;
  markManualEntry(id: string): Promise<void>;
  markAwaitingBudget(id: string): Promise<void>;
  savePendingReview(id: string, extraction: SavedExtraction): Promise<void>;
  /** Giữ chỗ nguyên tử (đã dùng + ước tính ≤ trần); chứng từ đã có chỗ giữ thì dùng lại. false = hết ngân sách. */
  reserveBudget(id: string, call: BudgetCall): Promise<boolean>;
  /** Xóa chỗ giữ rồi ghi chi phí thực vào đúng tháng đã giữ; chạy lặp không tính trùng. */
  settleBudget(id: string, costUsd: number, call: BudgetCall): Promise<void>;
}
export interface ExtractionRepository {
  withFamily<T>(familyId: string, work: (store: ExtractionStore) => Promise<T>): Promise<T>;
}
export interface ObjectReader {
  get(key: string): Promise<Uint8Array>;
}
export interface ImageConverter {
  heicToJpeg(bytes: Uint8Array): Promise<Uint8Array>;
}
export interface ExtractorImage {
  bytes: Uint8Array;
  mimeType: string;
}
interface ExtractorCall {
  provider: string;
  model: string;
  costUsd: number;
}
export type ExtractorResult =
  | (ExtractorCall & { ok: true; content: ExtractedContent })
  | (ExtractorCall & { ok: false; reason: 'invalid_json' | 'schema_mismatch' });
/** Lỗi mạng/HTTP ném exception để pg-boss thử lại; phản hồi sai định dạng trả `ok: false`. */
export interface DocumentExtractor {
  extract(image: ExtractorImage): Promise<ExtractorResult>;
}
export interface BudgetPolicy {
  estimatedCostUsd: number;
  defaultMonthlyCapUsd: number;
  now(): Date;
}
export interface ExtractionDependencies {
  repository: ExtractionRepository;
  budget: BudgetPolicy;
  storage: ObjectReader;
  images: ImageConverter;
  extractor: DocumentExtractor;
  ocrImages: ApprovedOcrImageReader;
}

export interface PreviewImageConverter {
  toWebp(bytes: Uint8Array, mimeType: string): Promise<Uint8Array>;
}

export interface ApprovedOcrImageReader {
  get(key: string): Promise<ExtractorImage & { sha256: string }>;
}

/** Duyệt gia đình (bảng families không áp RLS) rồi trong withFamilyScope chuyển + enqueue cùng transaction. */
export interface BudgetRequeueRepository {
  listFamilyIds(): Promise<string[]>;
  requeueFamily(familyId: string): Promise<number>;
}
