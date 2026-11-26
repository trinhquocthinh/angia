import type { PainEntry, PainIssueDetail } from '@angia/contracts';
import { PainIssueDetailHeader } from './PainIssueDetailHeader';
import { PainIssueLifecycleActions } from './PainIssueLifecycleActions';
import { PainEntryList } from './PainEntryList';
import { ExerciseNotes } from '../ExerciseNoteCard/ExerciseNotes';
import { PainIssueChart } from '../PainIssueChart/PainIssueChart';
import { PainStatusHistory } from './PainStatusHistory';
import { InlinePainEntry } from './InlinePainEntry';
import { EditPainEntrySheet } from './EditPainEntrySheet';
import type { PainIssueDetailProps } from './painIssueDetailTypes';
type Props = PainIssueDetailProps & {
  api: NonNullable<PainIssueDetailProps['api']>;
  issue: PainIssueDetail;
  editing: PainEntry | null;
  notice: string | null;
  version: number;
  allowed: boolean;
  edit: (entry: PainEntry | null) => void;
  saved: (message: string) => void;
  exerciseSaved: (message: string) => void;
};
export function PainIssueDetailView(props: Props) {
  const { issue, api, session, profile, scope, allowed, version, saved, edit } = props;
  const ctx = { api, session, profile, scope, issue };
  return (
    <div className="min-w-0 space-y-6">
      <PainIssueDetailHeader
        issue={issue}
        onBack={props.onBack}
        actions={
          allowed ? (
            <PainIssueLifecycleActions {...props} onSaved={saved} onDeleted={props.onBack} />
          ) : undefined
        }
      />
      {props.notice && (
        <p
          role="status"
          className="rounded-2xl border border-accent/25 bg-accent-soft px-4 py-3 text-body font-medium text-accent"
        >
          {props.notice}
        </p>
      )}
      <div className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.95fr)] lg:items-start">
        <div className="min-w-0 space-y-6">
          {allowed && issue.status === 'tracking' && (
            <InlinePainEntry
              key={version}
              {...ctx}
              onClose={() => undefined}
              onSaved={saved}
              onContinueIssue={(handoff) => props.onOpenIssue(handoff.issueId)}
            />
          )}
          <PainIssueChart {...ctx} />
        </div>
        <div className="min-w-0 space-y-6">
          <PainEntryList entries={issue.entries} onEdit={allowed ? edit : undefined} />
          <ExerciseNotes {...ctx} issueId={issue.id} allowed={allowed} onSaved={props.exerciseSaved} />
          <PainStatusHistory events={issue.statusEvents} />
        </div>
      </div>
      {props.editing && allowed && (
        <EditPainEntrySheet
          {...props}
          key={props.editing.id}
          api={api}
          entry={props.editing}
          onClose={() => edit(null)}
          onSaved={saved}
        />
      )}
    </div>
  );
}
