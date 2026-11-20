import { and, eq } from 'drizzle-orm';
import { profileGuardians } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';

// Dùng khi hồ sơ không còn thuộc nhóm cần giám hộ; caller đã khóa account → family → profile.
export async function clearProfileGuardians(
  tx: FamilyScopedTx,
  familyId: string,
  profileId: string,
  actorId: string,
) {
  const removed = await tx
    .delete(profileGuardians)
    .where(and(eq(profileGuardians.familyId, familyId), eq(profileGuardians.healthProfileId, profileId)))
    .returning({ accountId: profileGuardians.accountId });
  for (const target of removed)
    await writeAdminAuditEvent(tx, {
      familyId,
      actorAccountId: actorId,
      targetAccountId: target.accountId,
      targetProfileId: profileId,
      action: 'guardian_removed',
    });
}
