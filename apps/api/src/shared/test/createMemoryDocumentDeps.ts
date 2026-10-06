import type { DocumentDependencies, DocumentStore } from '@src/features/documents/application/ports.js';
import type { SourceDocument } from '@src/features/documents/domain/SourceDocument.js';

type Profile = NonNullable<Awaited<ReturnType<DocumentStore['findProfile']>>> & {
  id: string;
  familyId: string;
};

// Kho + S3 giả cho unit test: ghi tạm theo transaction, chỉ "commit" khi work thành công.
export function createMemoryDocumentDeps(profiles: Profile[], options: { failPutAt?: number } = {}) {
  const documents: SourceDocument[] = [];
  const batches: { id: string; healthProfileId: string; createdBy: string }[] = [];
  const objects = new Map<string, { body: Uint8Array; contentType: string }>();
  let puts = 0;
  let ids = 0;
  const deps: DocumentDependencies = {
    newId: () => `id-${++ids}`,
    storage: {
      put: async (key, body, contentType) => {
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
        const result = await work({
          findProfile: async (id) => profiles.find((p) => p.id === id && p.familyId === familyId) ?? null,
          insertBatch: async (batch) => {
            pendingBatches.push(batch);
          },
          insertDocument: async (input) => {
            const document: SourceDocument = {
              ...input,
              familyId,
              status: 'uploaded',
              documentDate: null,
              previewKey: null,
              createdAt: new Date('2026-10-06T00:00:00Z'),
            };
            pendingDocuments.push(document);
            return document;
          },
        });
        documents.push(...pendingDocuments);
        batches.push(...pendingBatches);
        return result;
      },
    },
  };
  return { deps, documents, batches, objects };
}
