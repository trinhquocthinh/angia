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
        | 'ERR_NOT_FOUND'
        | 'ERR_UNAUTHENTICATED'
        | 'ERR_OWNER_PROTECTED'
        | 'ERR_LAST_GUARDIAN';
    };

export interface HouseholdMembershipRepository {
  change(
    actor: MembershipActor & { familyId: string },
    targetId: string,
    change: MemberChange,
  ): Promise<MembershipResult>;
}
