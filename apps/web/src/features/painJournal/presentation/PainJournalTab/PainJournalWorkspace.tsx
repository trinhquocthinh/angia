import { painIssueWriteKey } from '../../application/painIssueWriteKey';
import type { PainWorkspaceProps } from './painJournalWorkspaceTypes';
import { PainJournalWorkspaceContent } from './PainJournalWorkspaceContent';
export function PainJournalWorkspace(props: PainWorkspaceProps) {
  const identity = painIssueWriteKey(props.session, props.profile, props.scope ?? 'main');
  return <PainJournalWorkspaceContent {...props} key={`${identity}:${props.session.csrfToken}`} />;
}
