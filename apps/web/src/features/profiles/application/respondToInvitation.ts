import type { InvitationDraft, InvitationReceipt, InvitationRepository } from './invitationPorts';
import { InvitationRequestError } from './InvitationRequestError';
export type InvitationResponseState =
  { state: 'receipt'; receipt: InvitationReceipt } | { state: 'unavailable' } | { state: 'error' };
export async function respondToInvitation(
  repository: InvitationRepository,
  token: string,
  body: InvitationDraft,
  signal: AbortSignal,
): Promise<InvitationResponseState | null> {
  try {
    const receipt = await repository.respond(token, body, signal);
    return signal.aborted ? null : { state: 'receipt', receipt };
  } catch (cause) {
    if (signal.aborted) return null;
    return {
      state: cause instanceof InvitationRequestError && cause.status === 404 ? 'unavailable' : 'error',
    };
  }
}
