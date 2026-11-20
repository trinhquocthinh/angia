import type { ProfileSession } from './ports';

export type ProfileGuardian = {
  accountId: string;
  displayName: string;
  isMe: boolean;
};

export type GuardianCandidate = {
  accountId: string;
  displayName: string;
  role: 'main' | 'member';
  isOwner: boolean;
  isSelf: boolean;
};

export type GuardianResult<T> = { ok: true; value: T } | { ok: false; code: string };

export type GuardianMutationOutcome = { ok: true } | { ok: false; message: string };

export interface ProfileGuardiansRepository {
  list(profileId: string, signal?: AbortSignal): Promise<GuardianResult<ProfileGuardian[]>>;
  listCandidates(signal?: AbortSignal): Promise<GuardianResult<GuardianCandidate[]>>;
  add(profileId: string, guardianAccountId: string, csrfToken: string): Promise<GuardianResult<void>>;
  removeSelf(profileId: string, csrfToken: string): Promise<GuardianResult<void>>;
}

export function profileGuardiansQueryKey(session: ProfileSession, profileId: string) {
  return ['profile-guardians', session.account.id, session.family?.id ?? null, profileId] as const;
}

export function guardianCandidatesQueryKey(session: ProfileSession) {
  return ['guardian-candidates', session.account.id, session.family?.id ?? null] as const;
}
