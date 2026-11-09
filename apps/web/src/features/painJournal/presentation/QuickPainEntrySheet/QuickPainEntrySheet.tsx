import { canWritePainIssue } from '../../application/canWritePainIssue';
import { painIssueWriteKey } from '../../application/painIssueWriteKey';
import { QuickPainEntryDialog } from './QuickPainEntryDialog';
import type { QuickPainEntryProps } from './quickPainEntryTypes';
export function QuickPainEntrySheet(props: QuickPainEntryProps) {
  return canWritePainIssue(props.session, props.profile, props.scope) ? (
    <QuickPainEntryDialog
      {...props}
      key={`${painIssueWriteKey(props.session, props.profile, props.scope)}:${props.issue.id}:${props.session.csrfToken}`}
    />
  ) : null;
}
