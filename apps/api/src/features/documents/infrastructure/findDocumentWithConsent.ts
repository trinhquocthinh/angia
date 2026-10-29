import { and, eq } from 'drizzle-orm';
import { healthProfiles, sourceDocuments } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { findProfileInFamily } from '@src/features/profiles/infrastructure/findProfileInFamily.js';

// Chứng từ kèm trạng thái đồng thuận của hồ sơ chủ (join) để cổng đồng thuận không thêm truy vấn.
// Khi lock: FOR UPDATE dòng chứng từ rồi FOR SHARE dòng hồ sơ và đọc lại đồng thuận dưới khóa,
// để tuần tự hóa với lệnh rút đồng thuận (FOR UPDATE hồ sơ) như createManualRecords.
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
  if (!row) return null;
  if (!lock) return { ...row.document, profileConsentStatus: row.profileConsentStatus };
  const locked = await findProfileInFamily(tx, familyId, row.document.healthProfileId, 'share');
  return { ...row.document, profileConsentStatus: locked?.consentStatus ?? row.profileConsentStatus };
}
