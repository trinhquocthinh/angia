import type { MembershipActor } from './membershipPorts.js';
import type { ProfileObjectStorage } from '../../profiles/application/ports.js';

export interface HouseholdLeaveInput {
  ownProfileDisposition?: 'keep' | 'delete' | undefined;
}
export type HouseholdLeaveResult =
  | { ok: true; deletedProfileId?: string }
  | {
      ok: false;
      code:
        | 'ERR_FORBIDDEN'
        | 'ERR_UNAUTHENTICATED'
        | 'ERR_NOT_FOUND'
        | 'ERR_VALIDATION'
        | 'ERR_OWNER_MUST_TRANSFER'
        | 'ERR_OWNER_MUST_DELETE_FAMILY'
        | 'ERR_LAST_GUARDIAN';
      details?: { profileIds: readonly string[] };
    };
export interface HouseholdLeaveRepository {
  leave(
    actor: MembershipActor & { familyId: string },
    input: HouseholdLeaveInput,
  ): Promise<HouseholdLeaveResult>;
}
export interface HouseholdLeaveDependencies {
  repository: HouseholdLeaveRepository;
  storage: ProfileObjectStorage;
  logger: { warn(obj: object, msg: string): void };
}
