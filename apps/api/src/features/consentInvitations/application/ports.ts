import type { HealthProfile } from '@src/features/profiles/domain/HealthProfile.js';
import type { Invitation, InvitationClaims, InvitationResponse } from '../domain/Invitation.js';

export interface InvitationTokenCodec {
  issue(claims: InvitationClaims): string;
  verify(token: string): InvitationClaims | null;
  hash(token: string): string;
}
export interface InvitationStore {
  lockProfile(id: string): Promise<HealthProfile | null>;
  lockInvitation(claims: InvitationClaims): Promise<Invitation | null>;
  inviterName(accountId: string | null): Promise<string | null>;
  revokePending(profileId: string, at: Date): Promise<void>;
  insertInvitation(invitation: Invitation): Promise<void>;
  setStatus(profileId: string, status: 'pending' | 'invited'): Promise<void>;
  recordResponse(invitation: Invitation, response: InvitationResponse, at: Date): Promise<void>;
}
export interface InvitationRepository {
  withFamily<T>(familyId: string, work: (store: InvitationStore) => Promise<T>): Promise<T>;
}
export interface InvitationDependencies {
  repository: InvitationRepository;
  codec: InvitationTokenCodec;
  now(): Date;
  newId(): string;
}
