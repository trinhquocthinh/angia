import type { PainProfileContext } from '../../application/painProfileContext';
import type { ProfileSession } from '@src/features/profiles/application/ports';
import type {
  PainContextReader,
  ExerciseNoteWriter,
  PainIssueLifecycleApi,
  PainEntryEditor,
  PainEntryWriter,
  PainIssueReader,
} from '../../application/ports';
export type PainIssueDetailProps = {
  session: ProfileSession;
  profile: PainProfileContext;
  scope: 'main' | 'self';
  issueId: string;
  onBack: () => void;
  onOpenIssue: (issueId: string) => void;
  api?:
    | (PainIssueReader &
        PainEntryWriter &
        PainEntryEditor &
        PainContextReader &
        ExerciseNoteWriter &
        PainIssueLifecycleApi)
    | undefined;
};
