import { profileObjectPrefix } from '@angia/contracts';
import type { MembershipActor } from './membershipPorts.js';
import type { HouseholdLeaveDependencies, HouseholdLeaveInput, HouseholdLeaveResult } from './leavePorts.js';

export async function leaveHousehold(
  deps: HouseholdLeaveDependencies,
  actor: MembershipActor,
  input: HouseholdLeaveInput,
): Promise<HouseholdLeaveResult> {
  if (!actor.familyId) return { ok: false, code: 'ERR_FORBIDDEN' };
  const result = await deps.repository.leave({ ...actor, familyId: actor.familyId }, input);
  if (!result.ok) return result;
  if (result.deletedProfileId) {
    try {
      await deps.storage.deletePrefix(profileObjectPrefix(actor.familyId, result.deletedProfileId));
    } catch (error) {
      const reason = error instanceof Error ? error.name : 'unknown';
      deps.logger.warn(
        { familyId: actor.familyId, profileId: result.deletedProfileId, reason },
        'Chưa xoá xong ảnh khi rời nhà; chờ job vét',
      );
    }
  }
  return { ok: true };
}
