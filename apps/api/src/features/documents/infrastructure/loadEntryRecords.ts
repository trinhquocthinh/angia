import { and, eq, inArray, isNull, or, sql, type SQL } from 'drizzle-orm';
import { toMeasurement } from '@src/features/measurements/infrastructure/measurementRows.js';
import { toPrescription } from '@src/features/prescriptions/infrastructure/prescriptionRows.js';
import { labResults, measurements, prescriptionItems, prescriptions } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { DocumentEntryHead, EntryRecords } from '../domain/DocumentEntry.js';

type Scope = { tx: FamilyScopedTx; familyId: string; profileId: string };
type Entry = (id: string) => EntryRecords;

const createdKey = sql<string>`to_char(${labResults.createdAt} AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`;
const anyOf = (conditions: (SQL | false | undefined)[]) =>
  or(...conditions.filter((c): c is SQL => Boolean(c)));
const toLabResult = ({
  familyId: _family,
  testNameNormalized: _normalized,
  ...result
}: typeof labResults.$inferSelect) => result;

async function loadPrescriptions(
  { tx, familyId, profileId }: Scope,
  documentIds: string[],
  manualIds: string[],
  entry: Entry,
) {
  const filter = anyOf([
    documentIds.length > 0 && inArray(prescriptions.sourceDocumentId, documentIds),
    manualIds.length > 0 && inArray(prescriptions.id, manualIds),
  ]);
  if (!filter) return;
  const owned = and(eq(prescriptions.familyId, familyId), eq(prescriptions.healthProfileId, profileId));
  const rows = await tx.select().from(prescriptions).where(and(owned, filter));
  if (rows.length === 0) return;
  const ids = rows.map((row) => row.id);
  const items = await tx
    .select()
    .from(prescriptionItems)
    .where(and(eq(prescriptionItems.familyId, familyId), inArray(prescriptionItems.prescriptionId, ids)));
  for (const row of rows)
    entry(row.sourceDocumentId ?? row.id).prescription = toPrescription(
      row,
      items.filter((item) => item.prescriptionId === row.id),
    );
}

// Phiếu nhập tay không có khóa nhóm: khớp theo (ngày XN, thời điểm lưu) như truy vấn danh mục.
async function loadLabResults(
  { tx, familyId, profileId }: Scope,
  documentIds: string[],
  manualLabs: DocumentEntryHead[],
  entry: Entry,
) {
  const filter = anyOf([
    documentIds.length > 0 && inArray(labResults.sourceDocumentId, documentIds),
    manualLabs.length > 0 &&
      and(
        isNull(labResults.sourceDocumentId),
        inArray(
          labResults.resultDate,
          manualLabs.map((h) => h.entryDate),
        ),
      ),
  ]);
  if (!filter) return;
  const rows = await tx
    .select({ row: labResults, createdKey })
    .from(labResults)
    .where(and(eq(labResults.familyId, familyId), eq(labResults.healthProfileId, profileId), filter))
    .orderBy(labResults.createdAt, labResults.id);
  for (const { row, createdKey: key } of rows) {
    const owner =
      row.sourceDocumentId ??
      manualLabs.find((h) => h.entryDate === row.resultDate && h.createdKey === key)?.id;
    if (owner) entry(owner).labResults.push(toLabResult(row));
  }
}

async function loadMeasurements({ tx, familyId }: Scope, documentIds: string[], entry: Entry) {
  if (documentIds.length === 0) return;
  const rows = await tx
    .select()
    .from(measurements)
    .where(and(eq(measurements.familyId, familyId), inArray(measurements.sourceDocumentId, documentIds)))
    .orderBy(measurements.createdAt, measurements.id);
  for (const row of rows) entry(row.sourceDocumentId!).measurements.push(toMeasurement(row));
}

// SPEC-028: nạp theo lô (tối đa 4 truy vấn mỗi trang, không N+1) bản ghi của chứng từ đã duyệt
// và của đơn/phiếu nhập trực tiếp.
export async function loadEntryRecords(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  heads: readonly DocumentEntryHead[],
): Promise<Map<string, EntryRecords>> {
  const records = new Map<string, EntryRecords>();
  const entry: Entry = (id) => {
    const found = records.get(id) ?? { prescription: null, labResults: [], measurements: [] };
    records.set(id, found);
    return found;
  };
  const scope = { tx, familyId, profileId };
  const documentIds = heads
    .filter((h) => h.origin === 'document' && h.status === 'approved')
    .map((h) => h.id);
  const manual = heads.filter((h) => h.origin === 'manual');
  const manualPrescriptionIds = manual.filter((h) => h.type === 'prescription').map((h) => h.id);
  await loadPrescriptions(scope, documentIds, manualPrescriptionIds, entry);
  await loadLabResults(
    scope,
    documentIds,
    manual.filter((h) => h.type === 'lab_result'),
    entry,
  );
  await loadMeasurements(scope, documentIds, entry);
  return records;
}
