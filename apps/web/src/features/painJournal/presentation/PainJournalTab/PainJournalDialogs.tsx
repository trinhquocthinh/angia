import type { PainIssueHandoff } from '../../application/painIssueHandoff';
import { createPainJournalApi } from '../../infrastructure/painJournalApi';
import { NewPainIssueSheet } from '../NewPainIssueSheet/NewPainIssueSheet';
import { QuickPainEntrySheet } from '../QuickPainEntrySheet/QuickPainEntrySheet';
import { QuickPainEntryHandoff } from '../QuickPainEntrySheet/QuickPainEntryHandoff';
import type { PainWorkspaceProps, PainWorkspaceDialog } from './painJournalWorkspaceTypes';
const api = createPainJournalApi();
type Props = Pick<PainWorkspaceProps, 'session' | 'profile'> & {
  scope: 'main' | 'self';
  dialog: PainWorkspaceDialog;
  onClose: () => void;
  onSaved: (message: string) => void;
  onContinueIssue: (handoff: PainIssueHandoff) => void;
};
export function PainJournalDialogs({ dialog, ...props }: Props) {
  const common = { ...props, api };
  if (dialog.kind === 'create') return <NewPainIssueSheet {...common} issues={dialog.issues} />;
  if (dialog.kind === 'record') return <QuickPainEntrySheet {...common} issue={dialog.issue} />;
  return <QuickPainEntryHandoff {...common} handoff={dialog.handoff} />;
}
