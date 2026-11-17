export interface CreateHouseholdInput {
  name: string;
  invitationToken?: string | undefined;
}

export type CreateHouseholdOutcome =
  | { ok: true; family: { id: string; name: string; createdAt: Date } }
  | {
      ok: false;
      code:
        | 'ERR_ACCOUNT_ALREADY_IN_FAMILY'
        | 'ERR_REGISTRATION_CLOSED'
        | 'ERR_LEGAL_ACCEPTANCE_REQUIRED'
        | 'ERR_NOT_FOUND'
        | 'ERR_UNAUTHENTICATED';
    };

export interface HouseholdRepository {
  // Kho chịu trách nhiệm khoá account và ghi tất cả thay đổi trong một transaction.
  create(accountId: string, input: CreateHouseholdInput): Promise<CreateHouseholdOutcome>;
}
