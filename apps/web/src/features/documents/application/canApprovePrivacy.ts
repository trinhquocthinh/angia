import type { PrivacyEditorState } from './privacyEditorState';
import { privacyCandidateKey } from './privacyCandidateKey';
export function canApprovePrivacy(state: PrivacyEditorState): boolean {
  return (
    state.candidate.state === 'ready' &&
    state.candidateRevision === state.revision &&
    state.loaded === privacyCandidateKey(state.candidate) &&
    state.checked
  );
}
