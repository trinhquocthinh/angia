import type { LabResult } from '@src/features/labResults/domain/LabResult.js';
import type { MeasurementValues } from '@src/features/measurements/domain/Measurement.js';
import {
  labResultFingerprint,
  measurementFingerprint,
  prescriptionFingerprint,
} from '../domain/contentFingerprint.js';
import { isDuplicate, type DocumentContent } from '../domain/isDuplicate.js';
import type { LabResultDraft, PrescriptionDraft } from './approvalDrafts.js';
import type { ApproveError, DuplicateRecord } from './approvalOutcome.js';
import type { ReviewStore } from './reviewPorts.js';

interface SavedContent {
  content: DocumentContent;
  record: DuplicateRecord;
}
type DuplicateCheck = Promise<Extract<ApproveError, { code: 'ERR_DUPLICATE_UNCONFIRMED' }> | null>;

const record = (
  saved: { sourceDocumentId: string | null; facility: string | null; createdAt: Date },
  recordDate: string,
): DuplicateRecord => ({
  duplicateOf: saved.sourceDocumentId,
  recordDate,
  facility: saved.facility,
  savedAt: saved.createdAt,
});

function firstDuplicate(incoming: DocumentContent, saved: SavedContent[]): Awaited<DuplicateCheck> {
  const match = saved.find((candidate) => isDuplicate(incoming, candidate.content));
  return match ? { ok: false, code: 'ERR_DUPLICATE_UNCONFIRMED', duplicate: match.record } : null;
}

// SPEC-012: so với mọi bản đã lưu của hồ sơ trong cùng ngày — duyệt chứng từ lẫn nhập trực tiếp.
export async function findPrescriptionDuplicate(
  store: ReviewStore,
  healthProfileId: string,
  data: PrescriptionDraft & { issuedDate: string },
): DuplicateCheck {
  const base = { healthProfileId, type: 'prescription' as const, date: data.issuedDate, time: null };
  const saved = await store.findPrescriptionsOn(healthProfileId, data.issuedDate);
  return firstDuplicate(
    { ...base, fingerprint: prescriptionFingerprint(data.items) },
    saved.map((p) => ({
      content: { ...base, fingerprint: prescriptionFingerprint(p.items) },
      record: record(p, p.issuedDate),
    })),
  );
}

// Mỗi chỉ số một dòng: gom theo chứng từ; bản nhập trực tiếp gom theo lần lưu (cùng thời điểm tạo).
const groupKey = (row: LabResult) => row.sourceDocumentId ?? `manual:${row.createdAt.getTime()}`;
function groupLabResults(rows: LabResult[]): LabResult[][] {
  const groups = new Map<string, LabResult[]>();
  for (const row of rows) groups.set(groupKey(row), [...(groups.get(groupKey(row)) ?? []), row]);
  return [...groups.values()];
}

export async function findLabResultDuplicate(
  store: ReviewStore,
  healthProfileId: string,
  data: LabResultDraft & { resultDate: string },
): DuplicateCheck {
  const base = { healthProfileId, type: 'lab_result' as const, date: data.resultDate, time: null };
  const saved = groupLabResults(await store.findLabResultsOn(healthProfileId, data.resultDate));
  return firstDuplicate(
    { ...base, fingerprint: labResultFingerprint(data.items) },
    saved.map((rows) => ({
      content: { ...base, fingerprint: labResultFingerprint(rows) },
      record: record(rows[0]!, data.resultDate),
    })),
  );
}

export async function findMeasurementDuplicate(
  store: ReviewStore,
  healthProfileId: string,
  reading: { values: MeasurementValues; measuredOn: string; measuredTime: string | null },
): DuplicateCheck {
  const base = { healthProfileId, type: 'device_reading' as const, date: reading.measuredOn };
  const saved = await store.findMeasurementsOn(healthProfileId, reading.values.kind, reading.measuredOn);
  return firstDuplicate(
    { ...base, time: reading.measuredTime, fingerprint: measurementFingerprint(reading.values) },
    saved.map((m) => ({
      content: { ...base, time: m.measuredTime, fingerprint: measurementFingerprint(m) },
      record: record({ ...m, facility: null }, m.measuredOn),
    })),
  );
}
