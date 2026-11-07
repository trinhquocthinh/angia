import type { BodyLocation, PainIssueSummary } from '@angia/contracts';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import type { PainIssueWriter } from '../../application/ports';
import type { PainIssueHandoff } from '../../application/painIssueHandoff';
export type NewPainIssueSheetProps = {
  api: PainIssueWriter;
  session: ProfileSession;
  profile: HealthProfile;
  scope?: 'main' | 'self';
  issues: PainIssueSummary[];
  onClose: () => void;
  onContinueIssue: (handoff: PainIssueHandoff) => void;
};
export type FirstEntryValues = { title: string; level: number | null; note: string; recordedAt: string };
export type FirstEntryFieldsProps = {
  values: FirstEntryValues;
  onChange: (patch: Partial<FirstEntryValues>) => void;
};
export type RegionStepProps = {
  selected: BodyLocation | null;
  issues: PainIssueSummary[];
  onSelect: (location: BodyLocation) => void;
};
