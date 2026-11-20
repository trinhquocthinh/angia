import { profileGuardians } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
export async function recordCreatorGuardian(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  actorId: string,
) {
  await tx.insert(profileGuardians).values({ familyId, healthProfileId: profileId, accountId: actorId });
  await writeAdminAuditEvent(tx, {
    actorAccountId: actorId,
    familyId,
    targetAccountId: actorId,
    targetProfileId: profileId,
    action: 'guardian_added',
  });
}
