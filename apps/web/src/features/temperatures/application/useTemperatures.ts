import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { profileScopeKey } from '@src/features/profiles/application/profileScopeKey';
import { selfProfileKey } from '@src/features/selfProfile/application/selfProfileKey';
import { useSelfRecovery } from '@src/features/selfProfile/application/useSelfRecovery';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { TemperatureRangeQuery, TemperatureRepository } from './ports';

export function useTemperatures(
  repository: TemperatureRepository,
  session: ProfileSession,
  profileId: string,
  filter: TemperatureRangeQuery,
  readOnly: boolean,
  consentConfirmed: boolean,
) {
  const client = useQueryClient();
  const enabled =
    consentConfirmed &&
    Boolean(session.family) &&
    (readOnly ? session.account.healthProfileId === profileId : session.role === 'main');
  const prefix = readOnly
    ? [...selfProfileKey(session), 'temperatures']
    : ['temperatures', session.account.id, session.family?.id, profileId];
  const query = useQuery({
    queryKey: [...prefix, filter.from, filter.to],
    enabled,
    retry: false,
    staleTime: 0,
    queryFn: ({ signal }) => repository.list(readOnly ? null : profileId, filter, signal),
  });
  useSelfRecovery(session, query.error);
  useEffect(() => {
    if (query.error instanceof MedicationRequestError && [401, 403, 404, 409].includes(query.error.status)) {
      void client.invalidateQueries({ queryKey: [...profileScopeKey(session), 'list'], exact: true });
    }
  }, [client, query.error, session]);
  return { ...query, data: enabled && !query.isError && !query.isFetching ? query.data : undefined };
}
