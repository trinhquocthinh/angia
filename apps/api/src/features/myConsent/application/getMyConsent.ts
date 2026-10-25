import type { MyConsentProfile, MyConsentRepository } from './ports.js';

// SPEC-036: hồ sơ lấy từ phiên nhưng luôn đọc lại dưới RLS vì healthProfileId trong phiên có thể đã cũ.
export async function getMyConsent(
  repository: MyConsentRepository,
  actor: { familyId: string; healthProfileId: string | null },
): Promise<{ profile: (MyConsentProfile & { withdrawnAt: Date | null }) | null }> {
  const { healthProfileId } = actor;
  if (!healthProfileId) return { profile: null };
  const profile = await repository.withFamily(actor.familyId, (store) => store.readProfile(healthProfileId));
  return { profile };
}
