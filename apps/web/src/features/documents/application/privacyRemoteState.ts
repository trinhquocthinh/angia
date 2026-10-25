import { privacyCandidateKey } from './privacyCandidateKey';
import type { PrivacyEditorAction, PrivacyEditorState } from './privacyEditorState';
export function privacyRemoteState(
  state: PrivacyEditorState,
  action: Extract<PrivacyEditorAction, { type: 'remote' | 'loaded' | 'check' }>,
): PrivacyEditorState {
  if (action.type === 'remote') {
    if (action.revision < state.candidateRevision) return state;
    const same =
      privacyCandidateKey(action.draft) === privacyCandidateKey(state.candidate) &&
      action.revision === state.candidateRevision;
    return {
      ...state,
      candidate: action.draft,
      candidateRevision: action.revision,
      loaded: same ? state.loaded : null,
      checked: same ? state.checked : false,
    };
  }
  const viewed = state.candidate.state === 'ready' && state.candidateRevision === state.revision;
  if (action.type === 'loaded')
    return viewed && `${action.draftId}:${action.sha256}` === privacyCandidateKey(state.candidate)
      ? { ...state, loaded: privacyCandidateKey(state.candidate) }
      : state;
  return {
    ...state,
    checked: action.checked && viewed && state.loaded === privacyCandidateKey(state.candidate),
  };
}
