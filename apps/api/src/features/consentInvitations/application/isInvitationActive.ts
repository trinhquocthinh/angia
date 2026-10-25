import type { Invitation } from '../domain/Invitation.js';

export function isInvitationActive(
  invitation: Invitation | null,
  tokenHash: string,
  now: Date,
): invitation is Invitation {
  return (
    invitation !== null &&
    invitation.tokenHash === tokenHash &&
    invitation.revokedAt === null &&
    invitation.expiresAt.getTime() > now.getTime()
  );
}
