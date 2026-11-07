import type { PainProfileContext } from '../../application/painProfileContext';
import type { PainIssueSummary } from '@angia/contracts';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type { PainEntryWriter, PainIssueLifecycleApi } from '../../application/ports';
export type PainIssueLifecycleProps = {
  api: PainIssueLifecycleApi & Pick<PainEntryWriter, 'reopen'>;
  session: ProfileSession;
  profile: PainProfileContext;
  scope: 'main' | 'self';
  issue: PainIssueSummary;
  onClose: () => void;
  onSaved: (message: string) => void;
  onDeleted: () => void;
  onOpenIssue: (issueId: string) => void;
};
