import type { components } from '@src/shared/api/schema.gen';
export type InvitationCreated = components['schemas']['ProfileLinkCreated'];
export type InvitationView = components['schemas']['ProfileLinkView'];
export type InvitationDecision = components['schemas']['ProfileLinkAcceptRequest']['decision'];
export type InvitationReceipt = components['schemas']['ProfileLinkReceipt'];
export interface InvitationRepository {
  view(token: string, signal?: AbortSignal): Promise<InvitationView>;
  respond(
    token: string,
    decision: InvitationDecision,
    csrfToken: string,
    signal?: AbortSignal,
  ): Promise<InvitationReceipt>;
}
