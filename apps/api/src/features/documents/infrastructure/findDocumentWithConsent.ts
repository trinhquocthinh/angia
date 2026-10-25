import { and, eq } from 'drizzle-orm';
import { healthProfiles, sourceDocuments } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

// Chứng từ kèm trạng thái đồng thuận của hồ sơ chủ (join) để cổng đồng thuận không thêm truy vấn.
// Khóa FOR UPDATE chỉ áp lên dòng chứng từ, không khóa dòng hồ sơ.
export async function findDocumentWithConsent(
  tx: FamilyScopedTx,
  familyId: string,
  id: string,
  lock: boolean,
) {
  const query = tx
    .select({ document: sourceDocuments, profileConsentStatus: healthProfiles.consentStatus })
    .from(sourceDocuments)
    .innerJoin(healthProfiles, eq(healthProfiles.id, sourceDocuments.healthProfileId))
    .where(and(eq(sourceDocuments.id, id), eq(sourceDocuments.familyId, familyId)));
  const row = (await (lock ? query.for('update', { of: sourceDocuments }) : query))[0];
  return row ? { ...row.document, profileConsentStatus: row.profileConsentStatus } : null;
}
