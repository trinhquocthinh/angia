import type { InvitationVerifier, VerifiedInvitation } from '../application/ports.js';

// shortcut: chưa có lời mời SPEC-065, thay ở E27-S3-T3
export function createInvitationVerifier(): InvitationVerifier {
  return {
    async verify(_token: string): Promise<VerifiedInvitation | null> {
      return null;
    },
  };
}
