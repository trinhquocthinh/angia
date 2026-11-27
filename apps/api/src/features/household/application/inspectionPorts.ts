export type InspectedHouseholdInvitation =
  { kind: 'join_family'; role: 'main' | 'member' } | { kind: 'found_family' };

export interface InvitationInspectionRepository {
  verify(token: string): Promise<InspectedHouseholdInvitation | null>;
}
