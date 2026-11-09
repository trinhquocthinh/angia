import { painIssueWriteKey } from '../../application/painIssueWriteKey';
import { canWritePainIssue } from '../../application/canWritePainIssue';
import { NewPainIssueDialog } from './NewPainIssueDialog';
import type { NewPainIssueSheetProps } from './newPainIssueTypes';
export function NewPainIssueSheet(props: NewPainIssueSheetProps) {
  return canWritePainIssue(props.session, props.profile, props.scope ?? 'main') ? (
    <NewPainIssueDialog
      key={painIssueWriteKey(props.session, props.profile, props.scope ?? 'main')}
      {...props}
    />
  ) : null;
}
