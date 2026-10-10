import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminRequestError } from './AdminRequestError';
import type { AiBudgetRepository } from './ports';

const BUDGET_KEY = ['admin', 'extraction-cap'];

// SPEC-013: đọc/ghi trần ngân sách AI; lỗi phiên/quyền thì làm mới phiên như các thao tác quản trị khác.
export function useAiBudget(repository: AiBudgetRepository, csrfToken: string | null) {
  const client = useQueryClient();
  const budget = useQuery({
    queryKey: BUDGET_KEY,
    enabled: Boolean(csrfToken),
    retry: false,
    queryFn: ({ signal }) => repository.get(signal),
  });
  const save = useMutation({
    retry: false,
    mutationFn: (monthlyCapUsd: number) => {
      if (!csrfToken) throw new AdminRequestError('ERR_UNAUTHENTICATED', 401);
      return repository.setCap(monthlyCapUsd, csrfToken);
    },
    onSuccess: (saved) => client.setQueryData(BUDGET_KEY, saved),
    onError: async (error) => {
      if (error instanceof AdminRequestError && (error.status === 401 || error.status === 403)) {
        await client.invalidateQueries({ queryKey: ['current-session'] });
      }
    },
  });
  return { budget, save };
}
