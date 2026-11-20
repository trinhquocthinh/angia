import type { MembershipActor } from '@src/features/household/application/membershipPorts.js';
export type GuardianActor = MembershipActor;
export type ProfileGuardian = { accountId: string; displayName: string; isMe: boolean };
export type ListProfileGuardiansResult =
  { ok: true; guardians: ProfileGuardian[] } | { ok: false; code: 'ERR_FORBIDDEN' | 'ERR_NOT_FOUND' };
export type GuardianResult =
  | { ok: true }
  | {
      ok: false;
      code:
        'ERR_FORBIDDEN' | 'ERR_UNAUTHENTICATED' | 'ERR_NOT_FOUND' | 'ERR_VALIDATION' | 'ERR_LAST_GUARDIAN';
    };
export interface ProfileGuardianRepository {
  list(actor: MembershipActor & { familyId: string }, profileId: string): Promise<ListProfileGuardiansResult>;
  change(
    actor: MembershipActor & { familyId: string },
    profileId: string,
    targetId: string | null,
  ): Promise<GuardianResult>;
}
