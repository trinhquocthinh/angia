import type { ProfileSession } from './ports';
export function profileScopeKey(session: ProfileSession | null | undefined) {
  return ['profiles', session?.account.id ?? null, session?.family?.id ?? null] as const;
}
