import type { MembershipActor } from './membershipPorts.js';
import type { DeletionRequestResult, HouseholdDeletionRepository } from './deletionPorts.js';

// Chỉ Chủ hộ: kho kiểm lại quyền Chủ hộ từ DB; ở đây chặn sớm người không phải main.
export async function requestHouseholdDeletion(
  repository: HouseholdDeletionRepository,
  actor: MembershipActor,
  confirmFamilyName: string,
): Promise<DeletionRequestResult> {
  if (!actor.familyId || actor.role !== 'main') return { ok: false, code: 'ERR_FORBIDDEN' };
  return repository.request({ ...actor, familyId: actor.familyId }, confirmFamilyName);
}
