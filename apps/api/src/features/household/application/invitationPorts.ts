export interface InvitationActor {
  accountId: string;
  familyId: string | null;
  role: 'main' | 'member' | null;
}

export type ScopedInvitationActor = InvitationActor & { familyId: string };
export type InvitationFailure = {
  ok: false;
  code: 'ERR_FORBIDDEN' | 'ERR_NOT_FOUND' | 'ERR_DELETION_PENDING' | 'ERR_UNAUTHENTICATED';
};

export interface IssuedHouseholdInvitation {
  invitationId: string;
  token: string;
  code: string;
  expiresAt: Date;
}

export interface HouseholdInvitationRepository {
  // Khoá và kiểm lại quyền DB; lời mời và audit phải cùng transaction.
  create(
    actor: ScopedInvitationActor,
    role: 'main' | 'member',
  ): Promise<{ ok: true; value: IssuedHouseholdInvitation } | InvitationFailure>;
  revoke(actor: ScopedInvitationActor, invitationId: string): Promise<{ ok: true } | InvitationFailure>;
}

export interface HouseholdInvitationDependencies {
  repository: HouseholdInvitationRepository;
  appBaseUrl: string;
}
