import type { QueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { selfProfileKey } from '@src/features/selfProfile/application/selfProfileKey';

export async function refreshTemperatureViews(
  client: QueryClient,
  session: ProfileSession,
  profileId: string,
) {
  const keys: unknown[][] = ['temperatures', 'timeline'].map((name) => [
    name,
    session.account.id,
    session.family?.id,
    profileId,
  ]);
  if (session.account.healthProfileId === profileId) {
    for (const name of ['temperatures', 'timeline']) keys.push([...selfProfileKey(session), name]);
  }
  await Promise.all(keys.map((queryKey) => client.invalidateQueries({ queryKey })));
}
