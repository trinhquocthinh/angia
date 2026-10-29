import { createHash } from 'node:crypto';
import type {
  DocumentExtractor,
  ExtractionDependencies,
  ExtractionStore,
  ExtractorImage,
  ExtractorResult,
} from '@src/features/extraction/application/ports.js';
import type { DocumentToExtract, DocumentType } from '@src/features/extraction/domain/ExtractionDocument.js';
import { createMemoryBudgetLedger, type MemoryBudgetOptions } from './createMemoryBudgetLedger.js';

type FakeResult =
  | Omit<Extract<ExtractorResult, { ok: true }>, 'provider' | 'model' | 'costUsd'>
  | {
      ok: false;
      reason: 'invalid_json' | 'schema_mismatch';
    };
interface Options {
  status?: DocumentToExtract['status'];
  declaredType?: DocumentType;
  result: FakeResult | Error;
  documentId?: string;
  familyId?: string;
  budget?: MemoryBudgetOptions;
  /** Mặc định true; false mô phỏng hồ sơ đã rút đồng thuận. */
  profileConsentConfirmed?: boolean;
}

/** Thời điểm cố định của unit test: 10:00 ngày 15/10/2026 giờ Việt Nam → tháng ngân sách 2026-10. */
const MEMORY_NOW = new Date('2026-10-15T03:00:00Z');
const MEMORY_MONTH = '2026-10';

type SavedExtraction = Parameters<ExtractionStore['savePendingReview']>[1];

// Kho + S3 + AI giả cho unit test: một chứng từ (mặc định `doc-1` thuộc `family-a`), AI tốn $0.001/lần gọi,
// ngân sách mặc định đã dùng $0 / trần $5, ước tính $0.02.
export function createMemoryExtractionDeps(options: Options) {
  const { documentId = 'doc-1', familyId: ownerFamilyId = 'family-a' } = options;
  const { document, approvedBytes, imageKey } = createDocumentFixture(options, documentId, ownerFamilyId);
  const objects = new Map([[imageKey, approvedBytes]]);
  const statusHistory: string[] = [];
  const extractions: (SavedExtraction & { documentId: string })[] = [];
  const extractorCalls: ExtractorImage[] = [];
  const ledger = createMemoryBudgetLedger(documentId, MEMORY_MONTH, options.budget);
  const setStatus = async (status: DocumentToExtract['status']) => {
    document.status = status;
    statusHistory.push(status);
  };
  const deps: ExtractionDependencies = {
    repository: {
      withFamily: (familyId, work) =>
        work({
          findDocument: async (id) =>
            familyId === ownerFamilyId && id === document.id ? { ...document } : null,
          hasLiveExtractionJob: async () => false,
          markExtracting: () => setStatus('extracting'),
          markManualEntry: () => setStatus('manual_entry'),
          markAwaitingBudget: () => setStatus('awaiting_budget'),
          ...ledger.store,
          savePendingReview: async (documentId, extraction) => {
            extractions.push({ documentId, ...extraction });
            await setStatus('pending_review');
          },
        }),
    },
    budget: {
      defaultMonthlyCapUsd: 5,
      defaultMonthlyScans: 0,
      now: () => MEMORY_NOW,
    },
    ocrImages: createMemoryOcrImages(objects),
    extractor: createFakeExtractor(options.result, extractorCalls),
  };
  return {
    deps,
    statusHistory,
    extractions,
    extractorCalls,
    ledger,
    objects,
    approvedBytes,
    imageKey,
  };
}

function createMemoryOcrImages(objects: Map<string, Uint8Array>): ExtractionDependencies['ocrImages'] {
  return {
    get: async (key) => {
      const bytes = objects.get(key);
      if (!bytes) throw new Error('Không có ảnh OCR');
      return { bytes, mimeType: 'image/jpeg', sha256: createHash('sha256').update(bytes).digest('hex') };
    },
  };
}

function createFakeExtractor(result: Options['result'], calls: ExtractorImage[]): DocumentExtractor {
  return {
    extract: async (image, beforeDispatch) => {
      await beforeDispatch?.();
      calls.push(image);
      if (result instanceof Error) throw result;
      return { ...result, provider: 'openrouter', model: 'google/gemini-3.1-flash-lite', costUsd: 0.001 };
    },
  };
}

function createDocumentFixture(options: Options, documentId: string, ownerFamilyId: string) {
  const imageKey = `families/${ownerFamilyId}/profiles/me/documents/${documentId}/images/image.jpg`;
  const approvedBytes = new Uint8Array([0xff, 0xd8]);
  const document: DocumentToExtract = {
    id: documentId,
    status: options.status ?? 'extracting',
    declaredType: options.declaredType ?? null,
    imageKey,
    imageSha256: createHash('sha256').update(approvedBytes).digest('hex'),
    privacyApprovedBy: 'account-main',
    privacyApprovedAt: new Date('2026-10-08T00:00:00Z'),
    profileConsentConfirmed: options.profileConsentConfirmed ?? true,
  };
  return { document, approvedBytes, imageKey };
}
