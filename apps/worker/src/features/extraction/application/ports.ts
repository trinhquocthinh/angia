import type { DocumentToExtract, DocumentType, ExtractedContent } from '../domain/ExtractionDocument.js';

type SavedExtraction = {
  type: DocumentType;
  provider: string;
  model: string;
  /** Payload đầy đủ SDD §2.1 đã qua schema contracts; domain chỉ đọc phần ExtractedContent. */
  payload: ExtractedContent;
  costUsd: number;
};
export interface ExtractionStore {
  findDocument(id: string): Promise<DocumentToExtract | null>;
  markExtracting(id: string): Promise<void>;
  markManualEntry(id: string): Promise<void>;
  savePendingReview(id: string, extraction: SavedExtraction): Promise<void>;
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
export interface ExtractionDependencies {
  repository: ExtractionRepository;
  storage: ObjectReader;
  images: ImageConverter;
  extractor: DocumentExtractor;
}
