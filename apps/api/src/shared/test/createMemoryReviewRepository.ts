import type { DocumentFilter, ReviewRepository } from '@src/features/documents/application/reviewPorts.js';
import type { SourceDocument } from '@src/features/documents/domain/SourceDocument.js';
import type { LabResult } from '@src/features/labResults/domain/LabResult.js';
import type { Measurement } from '@src/features/measurements/domain/Measurement.js';
import type { Prescription } from '@src/features/prescriptions/domain/Prescription.js';

const CREATED_AT = new Date('2026-10-07T00:00:00Z');

const filterDocuments = (documents: SourceDocument[], familyId: string, filter: DocumentFilter) =>
  documents.filter(
    (d) =>
      d.familyId === familyId &&
      (!filter.statuses?.length || filter.statuses.includes(d.status)) &&
      (!filter.profileId || d.healthProfileId === filter.profileId),
  );

// Kho duyệt giả cho unit test: ghi tạm theo transaction, chỉ "commit" khi work thành công.
// Phân trang thật kiểm ở integration test; bản giả trả cả danh sách.
export function createMemoryReviewRepository(
  seed: SourceDocument[],
  extractions: Record<string, unknown> = {},
) {
  const documents = seed.map((document) => ({ ...document }));
  const measurements: Measurement[] = [];
  const prescriptions: Prescription[] = [];
  const labResults: LabResult[] = [];
  let ids = 0;
  const nextId = (prefix: string) => `${prefix}-${++ids}`;
  const repository: ReviewRepository = {
    withFamily: async (familyId, work) => {
      const pending = { measurements: [] as Measurement[], prescriptions: [] as Prescription[] };
      const pendingLabs: LabResult[] = [];
      const updates = new Map<string, SourceDocument>();
      const owned = (id: string) => documents.find((d) => d.id === id && d.familyId === familyId) ?? null;
      const update = (id: string, changes: Partial<SourceDocument>) => {
        const updated = { ...owned(id)!, ...changes };
        updates.set(id, updated);
        return updated;
      };
      const result = await work({
        listDocuments: async (filter) => ({
          items: filterDocuments(documents, familyId, filter),
          nextCursor: null,
        }),
        findDocument: async (id) => owned(id),
        findLatestExtraction: async (id) => (owned(id) ? (extractions[id] ?? null) : null),
        insertMeasurement: async (input) => {
          const measurement = { ...input, id: nextId('m'), createdAt: CREATED_AT };
          pending.measurements.push(measurement);
          return measurement;
        },
        insertPrescription: async (input) => {
          const items = input.items.map((item) => ({ ...item, id: nextId('pi') }));
          const prescription = { ...input, items, id: nextId('p'), createdAt: CREATED_AT };
          pending.prescriptions.push(prescription);
          return prescription;
        },
        insertLabResults: async (inputs) => {
          const rows = inputs.map((input) => ({ ...input, id: nextId('l'), createdAt: CREATED_AT }));
          pendingLabs.push(...rows);
          return rows;
        },
        markApproved: async (id, documentDate) => update(id, { status: 'approved', documentDate }),
        markRejected: async (id) => update(id, { status: 'rejected' }),
      });
      measurements.push(...pending.measurements);
      prescriptions.push(...pending.prescriptions);
      labResults.push(...pendingLabs);
      for (const [id, updated] of updates) Object.assign(owned(id)!, updated);
      return result;
    },
  };
  return { repository, documents, measurements, prescriptions, labResults };
}
