import type { PainProfileContext } from './painProfileContext';
import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { PainIssueQuery } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import { profileScopeKey } from '@src/features/profiles/application/profileScopeKey';
import { selfProfileKey } from '@src/features/selfProfile/application/selfProfileKey';
import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { PainJournalApi } from './ports';

export function usePainIssues(
  api: PainJournalApi,
  session: ProfileSession,
  profile: PainProfileContext,
  scope: 'main' | 'self' = 'main',
  status: PainIssueQuery['status'] = 'all',
) {
  const client = useQueryClient();
  const enabled =
    Boolean(session.family) &&
    session.family?.id === profile.familyId &&
    profile.consentStatus === 'confirmed' &&
    (scope === 'self' ? session.account.healthProfileId === profile.id : session.role === 'main');
  const query = useQuery({
    queryKey: [...profileScopeKey(session), 'pain', scope, profile.id, status],
    enabled,
    retry: false,
    staleTime: 0,
    queryFn: ({ signal }) => {
      if (!enabled) throw new Error('Không thể đọc sổ đau nhức trong phạm vi này.');
      return api.list(scope === 'self' ? null : profile.id, { status }, signal);
    },
  });
  useEffect(() => {
    if (
      !(query.error instanceof MedicationRequestError) ||
      ![401, 403, 404, 409].includes(query.error.status)
    )
      return;
    void client.invalidateQueries({ queryKey: ['current-session'] });
    const key =
      scope === 'self' ? [...selfProfileKey(session), 'summary'] : [...profileScopeKey(session), 'list'];
    void client.invalidateQueries({ queryKey: key, exact: true });
  }, [client, query.error, scope, session]);
  // Ẩn dữ liệu cũ khi đang kiểm lại quyền hoặc gặp lỗi.
  return { ...query, data: enabled && !query.isError && !query.isFetching ? query.data : undefined };
}
