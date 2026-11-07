import type { PainIssueSummary } from '@angia/contracts';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { PainIssueHandoff } from '../../application/painIssueHandoff';
import type { PainJournalActions } from './painJournalActions';
export type PainWorkspaceProps = PainJournalActions & {
  session: ProfileSession;
  profile: HealthProfile;
  scope?: 'main' | 'self';
  onContinueIssue?: (handoff: PainIssueHandoff) => void;
};
export type PainWorkspaceDialog =
  | { kind: 'create'; issues: PainIssueSummary[] }
  | { kind: 'record'; issue: PainIssueSummary }
  | { kind: 'handoff'; handoff: Extract<PainIssueHandoff, { kind: 'existing' }> };
