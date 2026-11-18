export interface InvitationActor {
  accountId: string;
  familyId: string | null;
  role: 'main' | 'member' | null;
}

export type ScopedInvitationActor = InvitationActor & { familyId: string };
export type InvitationFailure = {
  ok: false;
  code:
    | 'ERR_FORBIDDEN'
    | 'ERR_NOT_FOUND'
    | 'ERR_DELETION_PENDING'
    | 'ERR_UNAUTHENTICATED'
    | 'ERR_INVITATION_EXISTS';
};

export interface IssuedHouseholdInvitation {
  invitationId: string;
  token: string;
  code: string;
  expiresAt: Date;
}

export interface ManagedHouseholdInvitation {
  invitationId: string;
  role: 'main' | 'member';
  own: boolean;
  status: 'active' | 'accepted' | 'expired' | 'revoked';
  createdAt: Date;
  expiresAt: Date;
  secrets: { token: string; code: string } | null;
}
export interface CurrentHouseholdInvitation {
  invitationId: string;
  role: 'main' | 'member';
  status: ManagedHouseholdInvitation['status'];
  expiresAt: Date;
  code: string | null;
  token: string | null;
}
export interface HouseholdInvitationRepository {
  current(
    actor: ScopedInvitationActor,
  ): Promise<{ ok: true; value: CurrentHouseholdInvitation[] } | InvitationFailure>;
  list(
    actor: ScopedInvitationActor,
    offset: number,
  ): Promise<
    { ok: true; value: { items: ManagedHouseholdInvitation[]; hasMore: boolean } } | InvitationFailure
  >;
  replace(
    actor: ScopedInvitationActor,
    invitationId: string,
  ): Promise<{ ok: true; value: IssuedHouseholdInvitation } | InvitationFailure>;
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
