import { useEffect, useId, useReducer } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { components } from '@src/shared/api/schema.gen';
import type { PrivacyRepository } from './privacyPorts';
import { privacyPollInterval } from './privacyPolling';
import { initialPrivacyEditor } from './initialPrivacyEditor';
import { privacyEditorReducer } from './privacyEditorState';
import { createPrivacyActions } from './createPrivacyActions';
import { usePrivacyActionRunner } from './usePrivacyActionRunner';
type Session = components['schemas']['MeContextResponse'];

// Thành phần gọi hook được remount theo chứng từ và phiên, kể cả khi CSRF thay đổi.
export function usePrivacyWorkspace(repository: PrivacyRepository, session: Session, id: string) {
  const client = useQueryClient();
  const [state, dispatch] = useReducer(privacyEditorReducer, undefined, initialPrivacyEditor);
  const instance = useId();
  const enabled = session.role === 'main' && Boolean(session.family);
  const runner = usePrivacyActionRunner(enabled);
  const key = ['privacy', session.account.id, session.family?.id, session.csrfToken, id, instance];
  const query = useQuery({
    queryKey: key,
    enabled,
    retry: false,
    staleTime: 0,
    refetchOnMount: 'always',
    queryFn: ({ signal }) => {
      const revision = state.candidateRevision;
      return repository.read(id, signal).then((draft) => ({ draft, revision }));
    },
    refetchInterval: (result) => privacyPollInterval(result.state.data?.draft),
  });
  useEffect(() => {
    if (query.data) dispatch({ type: 'remote', revision: query.data.revision, draft: query.data.draft });
  }, [query.data]);
  const actions = () =>
    createPrivacyActions({
      repository,
      id,
      csrfToken: session.csrfToken,
      state,
      client,
      key,
      reviewKey: ['review', session.account.id, session.family?.id],
      data: query.data?.draft,
      queryError: query.isError,
      dispatch,
      run: runner.run,
    });
  return {
    state,
    dispatch,
    busy: runner.busy,
    error: runner.error,
    query,
    create: () => actions().create(),
    approve: () => actions().approve(),
    manual: () => actions().manual(),
  };
}
