import { useQuery, useQueryClient } from '@tanstack/react-query';
import { accountErrorMessage } from './accountErrorMessage';
import { parseCurrentLegal } from './parseCurrentLegal';
import type { AccountResult, CurrentLegal, FetchCurrentLegal } from './ports';
const key = ['account-legal'] as const;
export function useLegalDocuments(fetchLegal: FetchCurrentLegal) {
  const client = useQueryClient();
  const query = useQuery({ queryKey: key, queryFn: fetchLegal, retry: false, staleTime: 0 });
  const legal = query.data?.ok ? parseCurrentLegal(query.data.data) : null;
  const error = query.isPending
    ? null
    : !legal
      ? accountErrorMessage(query.data && !query.data.ok ? query.data.code : 'UNKNOWN')
      : null;
  async function refresh(current: unknown) {
    const parsed = parseCurrentLegal(current);
    if (parsed) client.setQueryData<AccountResult<CurrentLegal>>(key, () => ({ ok: true, data: parsed }));
    else {
      // Không giữ phiên bản cũ nếu lần tải lại thất bại.
      client.setQueryData<AccountResult<CurrentLegal>>(key, () => ({ ok: false, code: 'UNKNOWN' }));
      await query.refetch();
    }
  }
  return { legal, error, refresh, loading: query.isFetching };
}
