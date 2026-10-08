import { createHash } from 'node:crypto';
import type {
  ExtractionDependencies,
  ExtractionStore,
  ExtractorImage,
  ExtractorResult,
} from '@src/features/extraction/application/ports.js';
import type { DocumentToExtract, DocumentType } from '@src/features/extraction/domain/ExtractionDocument.js';

type FakeResult =
  | Omit<Extract<ExtractorResult, { ok: true }>, 'provider' | 'model' | 'costUsd'>
  | {
      ok: false;
      reason: 'invalid_json' | 'schema_mismatch';
    };
interface Options {
  status?: DocumentToExtract['status'];
  declaredType?: DocumentType;
  mimeType?: string;
  result: FakeResult | Error;
  documentId?: string;
  familyId?: string;
}

type SavedExtraction = Parameters<ExtractionStore['savePendingReview']>[1];

// Kho + S3 + AI giả cho unit test: một chứng từ (mặc định `doc-1` thuộc `family-a`), AI tốn $0.001/lần gọi.
export function createMemoryExtractionDeps(options: Options) {
  const { documentId = 'doc-1', familyId: ownerFamilyId = 'family-a' } = options;
  const { document, originalBytes, approvedBytes, ocrKey } = createDocumentFixture(
    options,
    documentId,
    ownerFamilyId,
  );
  const objects = new Map([
    [document.originalKey, originalBytes],
    [ocrKey, approvedBytes],
  ]);
  const statusHistory: string[] = [];
  const extractions: (SavedExtraction & { documentId: string })[] = [];
  const extractorCalls: ExtractorImage[] = [];
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
          markExtracting: () => setStatus('extracting'),
          markManualEntry: () => setStatus('manual_entry'),
          savePendingReview: async (documentId, extraction) => {
            extractions.push({ documentId, ...extraction });
            await setStatus('pending_review');
          },
        }),
    },
    storage: {
      get: async (key) => getMemoryObject(objects, key),
    },
    images: { heicToJpeg: async () => new Uint8Array([0xff, 0xd8]) },
    ocrImages: {
      get: async (key) => {
        const bytes = objects.get(key);
        if (!bytes) throw new Error('Không có ảnh OCR');
        return { bytes, mimeType: 'image/jpeg', sha256: createHash('sha256').update(bytes).digest('hex') };
      },
    },
    extractor: {
      extract: async (image) => {
        extractorCalls.push(image);
        if (options.result instanceof Error) throw options.result;
        return {
          ...options.result,
          provider: 'openrouter',
          model: 'google/gemini-3.1-flash-lite',
          costUsd: 0.001,
        };
      },
    },
  };
  return { deps, statusHistory, extractions, extractorCalls, objects, originalBytes, approvedBytes, ocrKey };
}

function createDocumentFixture(options: Options, documentId: string, ownerFamilyId: string) {
  const ORIGINAL_KEY = `families/${ownerFamilyId}/profiles/me/documents/${documentId}/original.jpg`;
  const originalBytes = new Uint8Array([1, 2, 3]);
  const approvedBytes = new Uint8Array([0xff, 0xd8]);
  const ocrKey = ORIGINAL_KEY + '.ocr.jpg';
  const document: DocumentToExtract = {
    id: documentId,
    status: options.status ?? 'extracting',
    declaredType: options.declaredType ?? null,
    originalKey: ORIGINAL_KEY,
    previewKey: null,
    ocrImageKey: ocrKey,
    ocrImageSha256: createHash('sha256').update(approvedBytes).digest('hex'),
    privacyApprovedBy: 'account-main',
    privacyApprovedAt: new Date('2026-10-08T00:00:00Z'),
    mimeType: options.mimeType ?? 'image/jpeg',
  };
  return { document, originalBytes, approvedBytes, ocrKey };
}

function getMemoryObject(objects: Map<string, Uint8Array>, key: string): Uint8Array {
  const bytes = objects.get(key);
  if (!bytes) throw new Error('Không có object');
  return bytes;
}
