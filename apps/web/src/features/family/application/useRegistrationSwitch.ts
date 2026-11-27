import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminRequestError } from './AdminRequestError';
import type { RegistrationSwitchRepository } from './ports';

const KEY = ['admin', 'registration-switch'];
export function useRegistrationSwitch(repository: RegistrationSwitchRepository, csrfToken: string | null) {
  const client = useQueryClient();
  const refreshSession = async (error: Error) => {
    if (error instanceof AdminRequestError && (error.status === 401 || error.status === 403)) {
      await client.invalidateQueries({ queryKey: ['current-session'] });
    }
  };
  const registration = useQuery({
    queryKey: KEY,
    enabled: Boolean(csrfToken),
    retry: false,
    queryFn: ({ signal }) => repository.get(signal),
  });
  useEffect(() => {
    const error = registration.error;
    if (error instanceof AdminRequestError && (error.status === 401 || error.status === 403)) {
      void client.invalidateQueries({ queryKey: ['current-session'] });
    }
  }, [client, registration.error]);
  const save = useMutation({
    retry: false,
    mutationFn: (open: boolean) => {
      if (!csrfToken) throw new AdminRequestError('ERR_UNAUTHENTICATED', 401);
      return repository.set(open, csrfToken);
    },
    onSuccess: (saved) => {
      client.setQueryData(KEY, saved);
    },
    onError: refreshSession,
  });
  return { registration, save };
}
