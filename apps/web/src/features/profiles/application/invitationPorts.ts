import type { components } from '@src/shared/api/schema.gen';
export type InvitationCreated = components['schemas']['ConsentInvitationCreated'];
export type InvitationView = components['schemas']['ConsentInvitationView'];
export type InvitationDraft = components['schemas']['ConsentInvitationRespondRequest'];
export type InvitationReceipt = components['schemas']['ConsentInvitationReceipt'];
export interface InvitationRepository {
  view(token: string, signal?: AbortSignal): Promise<InvitationView>;
  respond(token: string, body: InvitationDraft, signal?: AbortSignal): Promise<InvitationReceipt>;
}
