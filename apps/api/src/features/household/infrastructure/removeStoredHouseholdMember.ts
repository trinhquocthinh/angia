import { and, eq } from 'drizzle-orm';
import {
  accounts,
  families,
  healthProfiles,
  pushSubscriptions,
  removedMemberWindows,
} from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';

export async function removeStoredHouseholdMember(
  tx: FamilyScopedTx,
  actor: { accountId: string; familyId: string },
  target: { id: string; healthProfileId: string | null },
  at: Date,
) {
  if (target.healthProfileId) {
    const updated = await tx
      .update(healthProfiles)
      .set({
        consentStatus: 'withdrawn',
        consentWithdrawnAt: at,
        consentWithdrawnBy: actor.accountId,
      })
      .where(and(eq(healthProfiles.id, target.healthProfileId), eq(healthProfiles.familyId, actor.familyId)))
      .returning({ id: healthProfiles.id });
    if (updated.length !== 1) throw new Error('Hồ sơ liên kết không thuộc nhà đã kiểm chứng');
  }
  await tx
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.familyId, actor.familyId), eq(pushSubscriptions.accountId, target.id)));
  const window = {
    accountId: target.id,
    familyId: actor.familyId,
    healthProfileId: target.healthProfileId,
    removedAt: at,
    expiresAt: new Date(at.getTime() + 168 * 60 * 60 * 1000),
  };
  await tx
    .insert(removedMemberWindows)
    .values(window)
    .onConflictDoUpdate({
      target: [removedMemberWindows.accountId, removedMemberWindows.familyId],
      set: window,
    });
  await tx.update(families).set({ lastMemberRemovedAt: at }).where(eq(families.id, actor.familyId));
  await tx
    .update(accounts)
    .set({ familyId: null, familyRole: null, healthProfileId: null })
    .where(and(eq(accounts.id, target.id), eq(accounts.familyId, actor.familyId)));
}
