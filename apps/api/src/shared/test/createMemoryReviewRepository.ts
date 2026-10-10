import type { ProfileConsent } from '@src/features/documents/application/ports.js';
import type {
  DocumentFilter,
  ReviewRepository,
  ReviewStore,
} from '@src/features/documents/application/reviewPorts.js';
import type { SourceDocument } from '@src/features/documents/domain/SourceDocument.js';
import type { LabResult } from '@src/features/labResults/domain/LabResult.js';
import type { Measurement } from '@src/features/measurements/domain/Measurement.js';
import type { Prescription } from '@src/features/prescriptions/domain/Prescription.js';

interface MemoryProfile extends ProfileConsent {
  id: string;
  familyId: string;
}
const BASE_CREATED_AT = new Date('2026-10-07T00:00:00Z');

const filterDocuments = (documents: SourceDocument[], familyId: string, filter: DocumentFilter) =>
  documents.filter(
    (d) =>
      d.familyId === familyId &&
      (!filter.statuses?.length || filter.statuses.includes(d.status)) &&
      (!filter.profileId || d.healthProfileId === filter.profileId),
  );

const sameDay = <T extends { healthProfileId: string }>(
  rows: T[],
  profileId: string,
  on: (row: T) => boolean,
) => rows.filter((row) => row.healthProfileId === profileId && on(row));

// Bản đã commit để kiểm trùng (SPEC-012); gia đình giả lập chỉ có một nên không lọc thêm family.
const savedRecordFinders = (saved: {
  prescriptions: Prescription[];
  labResults: LabResult[];
  measurements: Measurement[];
}): Pick<ReviewStore, 'findPrescriptionsOn' | 'findLabResultsOn' | 'findMeasurementsOn'> => ({
  findPrescriptionsOn: async (profileId, date) =>
    sameDay(saved.prescriptions, profileId, (p) => p.issuedDate === date),
  findLabResultsOn: async (profileId, date) =>
    sameDay(saved.labResults, profileId, (l) => l.resultDate === date),
  findMeasurementsOn: async (profileId, kind, date) =>
    sameDay(saved.measurements, profileId, (m) => m.kind === kind && m.measuredOn === date),
});

interface PendingRecords {
  measurements: Measurement[];
  prescriptions: Prescription[];
  labs: LabResult[];
}

// Ghi tạm vào `pending`, chỉ "commit" khi work thành công.
const pendingInserters = (
  pending: PendingRecords,
  nextId: (prefix: string) => string,
  createdAt: Date,
): Pick<ReviewStore, 'insertMeasurement' | 'insertPrescription' | 'insertLabResults'> => ({
  insertMeasurement: async (input) => {
    const measurement = { ...input, id: nextId('m'), createdAt };
    pending.measurements.push(measurement);
    return measurement;
  },
  insertPrescription: async (input) => {
    const items = input.items.map((item) => ({ ...item, id: nextId('pi') }));
    const prescription = { ...input, items, id: nextId('p'), createdAt };
    pending.prescriptions.push(prescription);
    return prescription;
  },
  insertLabResults: async (inputs) => {
    const rows = inputs.map((input) => ({ ...input, id: nextId('l'), createdAt }));
    pending.labs.push(...rows);
    return rows;
  },
});

// Kho duyệt giả cho unit test: ghi tạm theo transaction, chỉ "commit" khi work thành công.
// Phân trang thật kiểm ở integration test; bản giả trả cả danh sách.
// Mặc định hồ sơ `me` của family-a đã đồng thuận (nhập trực tiếp SPEC-011).
export function createMemoryReviewRepository(
  seed: SourceDocument[],
  extractions: Record<string, unknown> = {},
  profiles: MemoryProfile[] = [{ id: 'me', familyId: 'family-a', consentStatus: 'confirmed' }],
) {
  const documents = seed.map((document) => ({ ...document }));
  const measurements: Measurement[] = [];
  const prescriptions: Prescription[] = [];
  const labResults: LabResult[] = [];
  let ids = 0;
  let transactions = 0;
  const nextId = (prefix: string) => `${prefix}-${++ids}`;
  const repository: ReviewRepository = {
    withFamily: async (familyId, work) => {
      // Như now() của PostgreSQL: mọi dòng ghi trong một transaction cùng thời điểm tạo.
      const CREATED_AT = new Date(BASE_CREATED_AT.getTime() + ++transactions * 1000);
      const pending: PendingRecords = { measurements: [], prescriptions: [], labs: [] };
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
        ...pendingInserters(pending, nextId, CREATED_AT),
        ...savedRecordFinders({ prescriptions, labResults, measurements }),
        findProfile: async (id) => profiles.find((p) => p.id === id && p.familyId === familyId) ?? null,
        markApproved: async (id, changes) => update(id, { status: 'approved', ...changes }),
        markRejected: async (id) => update(id, { status: 'rejected' }),
      });
      measurements.push(...pending.measurements);
      prescriptions.push(...pending.prescriptions);
      labResults.push(...pending.labs);
      for (const [id, updated] of updates) Object.assign(owned(id)!, updated);
      return result;
    },
  };
  return { repository, documents, measurements, prescriptions, labResults };
}
