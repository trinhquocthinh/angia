import type { ReviewRepository } from '@src/features/documents/application/reviewPorts.js';
import type { SourceDocument } from '@src/features/documents/domain/SourceDocument.js';
import type { Measurement } from '@src/features/measurements/domain/Measurement.js';

// Kho duyệt giả cho unit test: ghi tạm theo transaction, chỉ "commit" khi work thành công.
export function createMemoryReviewRepository(
  seed: SourceDocument[],
  extractions: Record<string, unknown> = {},
) {
  const documents = seed.map((document) => ({ ...document }));
  const measurements: Measurement[] = [];
  let ids = 0;
  const repository: ReviewRepository = {
    withFamily: async (familyId, work) => {
      const pending: Measurement[] = [];
      const updates = new Map<string, SourceDocument>();
      const owned = (id: string) => documents.find((d) => d.id === id && d.familyId === familyId) ?? null;
      const result = await work({
        listDocuments: async ({ status, profileId }) =>
          documents.filter(
            (d) =>
              d.familyId === familyId &&
              (!status || d.status === status) &&
              (!profileId || d.healthProfileId === profileId),
          ),
        findDocument: async (id) => owned(id),
        findLatestExtraction: async (id) => (owned(id) ? (extractions[id] ?? null) : null),
        insertMeasurement: async (input) => {
          const measurement = { ...input, id: `m-${++ids}`, createdAt: new Date('2026-10-07T00:00:00Z') };
          pending.push(measurement);
          return measurement;
        },
        markApproved: async (id, documentDate) => {
          const updated = { ...owned(id)!, status: 'approved' as const, documentDate };
          updates.set(id, updated);
          return updated;
        },
      });
      measurements.push(...pending);
      for (const [id, updated] of updates) Object.assign(owned(id)!, updated);
      return result;
    },
  };
  return { repository, documents, measurements };
}
