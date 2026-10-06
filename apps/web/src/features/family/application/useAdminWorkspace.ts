import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminRequestError } from './AdminRequestError';
import { executeAdminAction } from './executeAdminAction';
import type { AdminCommand, AdminRepository } from './ports';

export function useAdminWorkspace(repository: AdminRepository, csrfToken: string | null) {
  const client = useQueryClient();
  const families = useQuery({
    queryKey: ['admin', 'families'],
    enabled: Boolean(csrfToken),
    retry: false,
    queryFn: ({ signal }) => repository.listFamilies(signal),
  });
  const accounts = useQuery({
    queryKey: ['admin', 'accounts'],
    enabled: Boolean(csrfToken),
    retry: false,
    queryFn: ({ signal }) => repository.listAccounts(signal),
  });
  const action = useMutation({
    retry: false,
    mutationFn: (command: AdminCommand) => executeAdminAction(repository, csrfToken ?? '', command),
    onSuccess: async () => {
      await Promise.all([
        client.invalidateQueries({ queryKey: ['admin'] }),
        client.invalidateQueries({ queryKey: ['current-session'] }),
      ]);
    },
    onError: async (error) => {
      if (error instanceof AdminRequestError && (error.status === 401 || error.status === 403)) {
        await client.invalidateQueries({ queryKey: ['current-session'] });
      }
    },
  });
  return { families, accounts, action };
}
