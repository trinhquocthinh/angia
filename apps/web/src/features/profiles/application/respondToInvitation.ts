import type { InvitationDecision, InvitationReceipt, InvitationRepository } from './invitationPorts';
import { InvitationRequestError } from './InvitationRequestError';
export type InvitationResponseState =
  | { state: 'receipt'; receipt: InvitationReceipt }
  | { state: 'unavailable' }
  | { state: 'conflict' }
  | { state: 'error' };
export async function respondToInvitation(
  repository: InvitationRepository,
  token: string,
  decision: InvitationDecision,
  csrfToken: string,
  signal: AbortSignal,
): Promise<InvitationResponseState | null> {
  try {
    const receipt = await repository.respond(token, decision, csrfToken, signal);
    return signal.aborted ? null : { state: 'receipt', receipt };
  } catch (cause) {
    if (signal.aborted) return null;
    const status = cause instanceof InvitationRequestError ? cause.status : 0;
    return { state: status === 404 ? 'unavailable' : status === 409 ? 'conflict' : 'error' };
  }
}
