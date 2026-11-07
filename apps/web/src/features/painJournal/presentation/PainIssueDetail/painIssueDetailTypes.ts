import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { PainEntryEditor, PainEntryWriter, PainIssueReader } from '../../application/ports';
export type PainIssueDetailProps = {
  session: ProfileSession;
  profile: HealthProfile;
  scope: 'main' | 'self';
  issueId: string;
  onBack: () => void;
  onOpenIssue: (issueId: string) => void;
  api?: (PainIssueReader & PainEntryWriter & PainEntryEditor) | undefined;
};
