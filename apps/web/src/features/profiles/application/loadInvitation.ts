import type { InvitationRepository, InvitationView } from './invitationPorts';
import { InvitationRequestError } from './InvitationRequestError';
export type InvitationLoadState =
  { state: 'ready'; view: InvitationView } | { state: 'unavailable' } | { state: 'error' };
export async function loadInvitation(
  repository: InvitationRepository,
  token: string,
  signal: AbortSignal,
  update: (state: InvitationLoadState) => void,
) {
  try {
    const view = await repository.view(token, signal);
    if (!signal.aborted) update({ state: 'ready', view });
  } catch (error) {
    if (!signal.aborted)
      update({
        state: error instanceof InvitationRequestError && error.status === 404 ? 'unavailable' : 'error',
      });
  }
}
