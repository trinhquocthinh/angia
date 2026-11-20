export type HouseholdMemberRole = 'main' | 'member';

export type HouseholdMember = {
  accountId: string;
  displayName: string;
  role: HouseholdMemberRole;
  isOwner: boolean;
  isSelf: boolean;
};

type HouseholdMembersResult = { ok: true; value: HouseholdMember[] } | { ok: false; code: string };

export type MemberMutationResult = { ok: true; value: undefined } | { ok: false; code: string };

export type MemberActionOutcome =
  | { status: 'ok' }
  | { status: 'not_found'; message: string }
  | { status: 'error'; message: string }
  | { status: 'ignored' };

export type ChangeMemberRole = (
  targetAccountId: string,
  role: HouseholdMemberRole,
  csrfToken: string,
) => Promise<MemberMutationResult>;

export type RemoveMember = (targetAccountId: string, csrfToken: string) => Promise<MemberMutationResult>;

export type HouseholdMembersRepository = {
  list: () => Promise<HouseholdMembersResult>;
  changeRole: ChangeMemberRole;
  remove: RemoveMember;
};

export function householdMembersQueryKey(scope: string) {
  return ['household-members', scope] as const;
}
