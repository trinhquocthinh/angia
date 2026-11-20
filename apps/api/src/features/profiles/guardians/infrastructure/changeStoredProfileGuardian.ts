import { and, eq, sql } from 'drizzle-orm';
import { healthProfiles, profileGuardians } from '@src/shared/db/schema/index.js';
import type { FamilyScopedTx } from '@src/shared/db/withFamilyScope.js';
import { writeAdminAuditEvent } from '@src/shared/audit/writeAdminAuditEvent.js';
import type { MembershipActor } from '@src/features/household/application/membershipPorts.js';
import type { GuardianResult } from '../application/ports.js';
import { lockGuardianAccounts } from './lockGuardianAccounts.js';

export async function changeStoredProfileGuardian(
  tx: FamilyScopedTx,
  actor: MembershipActor & { familyId: string },
  profileId: string,
  targetId: string | null,
): Promise<GuardianResult> {
  const locked = await lockGuardianAccounts(tx, actor.familyId, actor.accountId);
  const [profile] = await tx
    .select({
      id: healthProfiles.id,
      eligible: sql<boolean>`COALESCE(extract(year FROM clock_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::int - ${healthProfiles.birthYear} < 18, false) AND NOT EXISTS (SELECT 1 FROM accounts WHERE health_profile_id=${healthProfiles.id})`,
    })
    .from(healthProfiles)
    .where(and(eq(healthProfiles.id, profileId), eq(healthProfiles.familyId, actor.familyId)))
    .for('update');
  if (!profile) return { ok: false, code: 'ERR_NOT_FOUND' };
  if (!locked.allowed) return { ok: false, code: 'ERR_FORBIDDEN' };
  if (!profile.eligible) return { ok: false, code: 'ERR_VALIDATION' };
  const scope = and(
    eq(profileGuardians.familyId, actor.familyId),
    eq(profileGuardians.healthProfileId, profileId),
  );
  const current = await tx.select({ id: profileGuardians.accountId }).from(profileGuardians).where(scope);
  if (!current.some((g) => g.id === actor.accountId)) return { ok: false, code: 'ERR_FORBIDDEN' };
  if (targetId !== null) {
    const target = locked.members.find((a) => a.id === targetId && a.familyId === actor.familyId);
    if (!target) return { ok: false, code: 'ERR_NOT_FOUND' };
    if (
      target.familyRole !== 'main' ||
      target.lockedAt ||
      current.length >= 2 ||
      current.some((g) => g.id === targetId)
    )
      return { ok: false, code: 'ERR_VALIDATION' };
    await tx
      .insert(profileGuardians)
      .values({ familyId: actor.familyId, healthProfileId: profileId, accountId: targetId });
  } else {
    if (current.length <= 1) return { ok: false, code: 'ERR_LAST_GUARDIAN' };
    await tx.delete(profileGuardians).where(and(scope, eq(profileGuardians.accountId, actor.accountId)));
  }
  await writeAdminAuditEvent(tx, {
    actorAccountId: actor.accountId,
    familyId: actor.familyId,
    targetAccountId: targetId ?? actor.accountId,
    targetProfileId: profileId,
    action: targetId === null ? 'guardian_removed' : 'guardian_added',
  });
  return { ok: true };
}
