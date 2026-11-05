import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import type { ConsentStatus } from '../domain/HealthProfile.js';
import { findProfileInFamily } from './findProfileInFamily.js';

// Trạng thái đồng thuận của hồ sơ trong gia đình; null = không có hồ sơ (hoặc thuộc gia đình khác).
export async function findProfileConsent(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
): Promise<ConsentStatus | null> {
  return (await findProfileInFamily(tx, familyId, profileId))?.consentStatus ?? null;
}
