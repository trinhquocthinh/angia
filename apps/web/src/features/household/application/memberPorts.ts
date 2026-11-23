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

export type TemporaryPasswordResult = {
  temporaryPassword: string;
  expiresAt: string;
};

export type ResetMemberPasswordResult =
  { ok: true; value: TemporaryPasswordResult } | { ok: false; code: string };

export type MemberActionOutcome =
  | { status: 'ok' }
  | { status: 'not_found'; message: string }
  | { status: 'error'; message: string }
  | { status: 'ignored' };

export type MemberPasswordResetOutcome =
  | { status: 'ok'; value: TemporaryPasswordResult }
  | { status: 'not_found'; message: string }
  | { status: 'owner_protected'; message: string }
  | { status: 'forbidden'; message: string }
  | { status: 'error'; message: string }
  | { status: 'ignored' };

export type ChangeMemberRole = (
  targetAccountId: string,
  role: HouseholdMemberRole,
  csrfToken: string,
) => Promise<MemberMutationResult>;

export type RemoveMember = (targetAccountId: string, csrfToken: string) => Promise<MemberMutationResult>;

export type ResetMemberPassword = (
  targetAccountId: string,
  csrfToken: string,
) => Promise<ResetMemberPasswordResult>;

export type HouseholdMembersRepository = {
  list: () => Promise<HouseholdMembersResult>;
  changeRole: ChangeMemberRole;
  remove: RemoveMember;
  resetPassword: ResetMemberPassword;
};

export function householdMembersQueryKey(scope: string) {
  return ['household-members', scope] as const;
}
