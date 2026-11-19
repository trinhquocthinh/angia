import type { MembershipActor } from '@src/features/household/application/membershipPorts.js';
export type GuardianActor = MembershipActor;
export type GuardianResult =
  | { ok: true }
  | {
      ok: false;
      code:
        'ERR_FORBIDDEN' | 'ERR_UNAUTHENTICATED' | 'ERR_NOT_FOUND' | 'ERR_VALIDATION' | 'ERR_LAST_GUARDIAN';
    };
export interface ProfileGuardianRepository {
  change(
    actor: MembershipActor & { familyId: string },
    profileId: string,
    targetId: string | null,
  ): Promise<GuardianResult>;
}
