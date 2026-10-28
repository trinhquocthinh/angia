import type { OcrGateReason } from './OcrGateBlockedError.js';
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
  defaultMonthlyCapUsd: number;
  /** CP5.5: số lượt hệ thống tự cấp cho gia đình chưa có dòng quota tháng. */
  defaultMonthlyScans: number;
}
export interface ExtractionStore {
  findDocument(id: string): Promise<DocumentToExtract | null>;
  hasLiveExtractionJob(id: string): Promise<boolean>;
  markExtracting(id: string): Promise<void>;
  markManualEntry(id: string): Promise<void>;
  markAwaitingBudget(id: string, reason?: OcrGateReason): Promise<void>;
  savePendingReview(id: string, extraction: SavedExtraction): Promise<void>;
  /** Giữ lượt quét khi còn quota và phí đối soát dưới trần; cổng đóng ném OcrGateBlockedError. */
  reserveBudget(id: string, call: BudgetCall): Promise<boolean>;
  dispatchBudget(id: string, call: BudgetCall): Promise<void>;
  /** Trả lượt còn giữ; không hoàn lượt đã gửi, không cộng chi phí OCR vào phí đã đối soát. */
  settleBudget(id: string, costUsd: number, call: BudgetCall): Promise<void>;
}
export interface ExtractionRepository {
  runExclusive?<T>(
    familyId: string,
    documentId: string,
    work: (repository: ExtractionRepository) => Promise<T>,
  ): Promise<T | null>;
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
  extract(image: ExtractorImage, beforeDispatch?: () => Promise<void>): Promise<ExtractorResult>;
}
export interface BudgetPolicy {
  defaultMonthlyCapUsd: number;
  defaultMonthlyScans: number;
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
  /** Chỉ enqueue khi đủ quota hoặc operation đã dùng lượt và cổng phí thực cho phép. */
  requeueFamily(familyId: string, call: BudgetCall): Promise<number>;
}
