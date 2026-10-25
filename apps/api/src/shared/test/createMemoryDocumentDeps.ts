import type { DocumentDependencies, DocumentStore } from '@src/features/documents/application/ports.js';
import type { SourceDocument } from '@src/features/documents/domain/SourceDocument.js';
import type { QuotaLimits, UsageCounts } from '@src/features/familyQuota/domain/FamilyQuota.js';
import { TEST_QUOTA_POLICY } from './testQuotaPolicy.js';

interface MemoryOptions {
  failPutAt?: number;
  usage?: UsageCounts;
  limits?: QuotaLimits;
}

type Profile = NonNullable<Awaited<ReturnType<DocumentStore['findProfile']>>> & {
  id: string;
  familyId: string;
};

// Mức dùng cố định cho unit test; ghi lại lần đọc có/không khóa để kiểm thứ tự (SPEC-030).
const memoryQuotaReader =
  (options: MemoryOptions, calls: string[]): DocumentStore['readQuotaUsage'] =>
  async (_dayStart, lock) => {
    calls.push(lock ? 'quota:lock' : 'quota:read');
    return options.usage ?? { storageBytes: 0, uploadsToday: 0, pendingJobs: 0 };
  };

// Kho + S3 + hàng đợi giả cho unit test: ghi tạm theo transaction, chỉ "commit" khi work thành công.
export function createMemoryDocumentDeps(profiles: Profile[], options: MemoryOptions = {}) {
  const documents: SourceDocument[] = [];
  const batches: { id: string; healthProfileId: string; createdBy: string }[] = [];
  const jobs: { documentId: string; familyId: string }[] = [];
  const objects = new Map<string, { body: Uint8Array; contentType: string }>();
  // Thứ tự gọi kho để kiểm quota đọc sau hồ sơ và trước khi ghi lô (SPEC-030).
  const calls: string[] = [];
  let puts = 0;
  let ids = 0;
  const deps: DocumentDependencies = {
    newId: () => `id-${++ids}`,
    quota: { ...TEST_QUOTA_POLICY, limits: options.limits ?? TEST_QUOTA_POLICY.limits },
    storage: {
      put: async (key, stream, contentType) => {
        const body = new Uint8Array(await new Response(stream).arrayBuffer());
        if (++puts === options.failPutAt) throw new Error('S3 lỗi giả lập');
        objects.set(key, { body, contentType });
      },
      delete: async (key) => {
        objects.delete(key);
      },
    },
    repository: {
      withFamily: async (familyId, work) => {
        const pendingDocuments: SourceDocument[] = [];
        const pendingBatches: typeof batches = [];
        const pendingJobs: typeof jobs = [];
        const result = await work({
          readQuotaUsage: memoryQuotaReader(options, calls),
          findProfile: async (id) => profiles.find((p) => p.id === id && p.familyId === familyId) ?? null,
          insertBatch: async (batch) => {
            calls.push('insertBatch');
            pendingBatches.push(batch);
          },
          insertDocument: async (input) => {
            const document: SourceDocument = {
              ...input,
              familyId,
              status: 'uploaded',
              documentDate: null,
              previewKey: null,
              ocrImageKey: null,
              createdAt: new Date('2026-10-06T00:00:00Z'),
            };
            pendingDocuments.push(document);
            return document;
          },
          enqueuePreview: async (documentId) => {
            pendingJobs.push({ documentId, familyId });
          },
        });
        documents.push(...pendingDocuments);
        batches.push(...pendingBatches);
        jobs.push(...pendingJobs);
        return result;
      },
    },
  };
  return { deps, documents, batches, objects, jobs, calls };
}
