import { useQuery } from '@tanstack/react-query';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { vietnamDate } from '@src/features/visitSummary/application/vietnamDate';
import { selfProfileKey } from './selfProfileKey';
import { useSelfRecovery } from './useSelfRecovery';

// Một mục dữ liệu tự xem; khóa theo ngày Việt Nam vì "hôm nay" do API tính.
export function useSelfQuery<T>(
  session: ProfileSession,
  section: string,
  read: (signal: AbortSignal) => Promise<T>,
) {
  const query = useQuery({
    queryKey: [...selfProfileKey(session), section, vietnamDate()],
    retry: false,
    queryFn: ({ signal }) => read(signal),
  });
  useSelfRecovery(session, query.error);
  return query;
}
