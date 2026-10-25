import type { Dispatch } from 'react';
import type { QueryClient } from '@tanstack/react-query';
import type { PrivacyDraft } from '@angia/contracts';
import type { PrivacyRepository } from './privacyPorts';
import type { PrivacyEditorAction, PrivacyEditorState } from './privacyEditorState';
import { canApprovePrivacy } from './canApprovePrivacy';
import { preparePrivacyDraft } from './preparePrivacyDraft';
type Options = {
  repository: PrivacyRepository;
  id: string;
  csrfToken: string;
  state: PrivacyEditorState;
  client: QueryClient;
  key: readonly unknown[];
  reviewKey: readonly unknown[];
  data: PrivacyDraft | undefined;
  queryError: boolean;
  dispatch: Dispatch<PrivacyEditorAction>;
  run: (task: () => Promise<void>) => Promise<void>;
};
export function createPrivacyActions(options: Options) {
  const { repository, id, csrfToken, state, client, key, reviewKey, data, queryError, dispatch, run } =
    options;
  const finish = async () => {
    await client.invalidateQueries({ queryKey: reviewKey });
  };
  return {
    create: () =>
      run(async () => {
        if (!data || queryError || state.candidate.state === 'pending' || data.state === 'pending') return;
        await client.cancelQueries({ queryKey: key });
        const previous = state.candidate.state === 'none' ? null : state.candidate.draftId;
        const draft = await preparePrivacyDraft(repository, id, state.edits, csrfToken, previous);
        client.setQueryData(key, { draft, revision: state.revision });
        dispatch({ type: 'remote', revision: state.revision, draft });
      }),
    approve: () =>
      run(async () => {
        if (queryError || !canApprovePrivacy(state) || state.candidate.state !== 'ready') return;
        await repository.approve(
          id,
          { draftId: state.candidate.draftId, sha256: state.candidate.sha256, confirmed: true },
          csrfToken,
        );
        await finish();
      }),
    manual: () =>
      run(async () => {
        await repository.manual(id, csrfToken);
        await finish();
      }),
  };
}
