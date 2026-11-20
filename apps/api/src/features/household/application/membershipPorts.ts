export interface MembershipActor {
  accountId: string;
  familyId: string | null;
  role: 'main' | 'member' | null;
}

export type MemberChange = { action: 'remove' } | { action: 'change_role'; role: 'main' | 'member' };
export type MembershipResult =
  | { ok: true }
  | {
      ok: false;
      code:
        | 'ERR_FORBIDDEN'
        | 'ERR_VALIDATION'
        | 'ERR_NOT_FOUND'
        | 'ERR_UNAUTHENTICATED'
        | 'ERR_OWNER_PROTECTED'
        | 'ERR_LAST_GUARDIAN';
    };

export interface HouseholdMember {
  accountId: string;
  displayName: string;
  role: 'main' | 'member';
  isOwner: boolean;
  isSelf: boolean;
}

export interface HouseholdMembersReader {
  list(
    actor: MembershipActor & { familyId: string },
  ): Promise<{ ok: true; value: HouseholdMember[] } | { ok: false; code: 'ERR_FORBIDDEN' }>;
}

export interface HouseholdMembershipRepository extends HouseholdMembersReader {
  change(
    actor: MembershipActor & { familyId: string },
    targetId: string,
    change: MemberChange,
  ): Promise<MembershipResult>;
}
