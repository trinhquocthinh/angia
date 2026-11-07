import { painIssueWriteKey } from '../../application/painIssueWriteKey';
import { PainIssueDetailContent } from './PainIssueDetailContent';
import type { PainIssueDetailProps } from './painIssueDetailTypes';
export function PainIssueDetail(props: PainIssueDetailProps) {
  const identity = painIssueWriteKey(props.session, props.profile, props.scope);
  return (
    <PainIssueDetailContent {...props} key={`${identity}:${props.issueId}:${props.session.csrfToken}`} />
  );
}
