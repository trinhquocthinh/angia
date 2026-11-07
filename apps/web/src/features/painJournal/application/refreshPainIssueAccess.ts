import type { QueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { profileScopeKey } from '@src/features/profiles/application/profileScopeKey';
import { selfProfileKey } from '@src/features/selfProfile/application/selfProfileKey';
export async function refreshPainIssueAccess(client: QueryClient, session: ProfileSession) {
  await Promise.all([
    client.invalidateQueries({ queryKey: ['current-session'] }),
    client.invalidateQueries({ queryKey: [...profileScopeKey(session), 'list'], exact: true }),
    client.invalidateQueries({ queryKey: [...selfProfileKey(session), 'summary'], exact: true }),
  ]);
}
