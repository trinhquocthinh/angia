import type { InvitationInspectionRepository, InspectedHouseholdInvitation } from './inspectionPorts.js';

export async function inspectHouseholdInvitation(
  repository: InvitationInspectionRepository,
  token: string,
): Promise<InspectedHouseholdInvitation | null> {
  const invitation = await repository.verify(token);
  if (!invitation) return null;
  return invitation.kind === 'join_family'
    ? { kind: 'join_family', role: invitation.role }
    : { kind: 'found_family' };
}
