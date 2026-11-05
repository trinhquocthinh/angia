import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { MyRevisitReminderRepository } from './ports';

export function useMyRevisitReminder(
  repository: MyRevisitReminderRepository,
  reminderId: string,
  session: ProfileSession | null | undefined,
) {
  const client = useQueryClient();
  const enabled = Boolean(session?.family);
  const query = useQuery({
    queryKey: ['my-revisit-reminder', session?.account.id ?? null, session?.family?.id ?? null, reminderId],
    enabled,
    staleTime: 0,
    retry: false,
    queryFn: ({ signal }) => repository.get(reminderId, signal),
  });
  useEffect(() => {
    if (query.error instanceof MedicationRequestError && query.error.status === 401)
      void client.invalidateQueries({ queryKey: ['current-session'] });
  }, [client, query.error]);
  return { ...query, data: enabled && !query.isFetching && !query.isError ? query.data : undefined };
}
