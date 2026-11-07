import type { CreatePainEntryRequest, PainIssueSummary } from '@angia/contracts';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { PainEntryWriter } from '../../application/ports';
import type { PainIssueHandoff } from '../../application/painIssueHandoff';

export type QuickPainEntryProps = {
  api: PainEntryWriter;
  session: ProfileSession;
  profile: HealthProfile;
  scope: 'main' | 'self';
  issue: PainIssueSummary;
  draft?: CreatePainEntryRequest | undefined;
  message?: string | undefined;
  onClose: () => void;
  onSaved: (message: string) => void;
  onContinueIssue: (handoff: PainIssueHandoff) => void;
};
