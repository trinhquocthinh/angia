import type { PainEntry, PainIssueDetail } from '@angia/contracts';
import { PainIssueDetailHeader } from './PainIssueDetailHeader';
import { PainEntryList } from './PainEntryList';
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
};
export function PainIssueDetailView(props: Props) {
  const { issue, api, session, profile, scope, allowed, version, saved, edit } = props;
  return (
    <div className="min-w-0 space-y-6">
      <PainIssueDetailHeader issue={issue} onBack={props.onBack} />
      {props.notice && <p role="status">{props.notice}</p>}
      {allowed && issue.status === 'tracking' && (
        <InlinePainEntry
          key={version}
          api={api}
          session={session}
          profile={profile}
          scope={scope}
          issue={issue}
          onClose={() => undefined}
          onSaved={saved}
          onContinueIssue={(handoff) => props.onOpenIssue(handoff.issueId)}
        />
      )}
      <PainEntryList entries={issue.entries} onEdit={allowed ? edit : undefined} />
      <PainStatusHistory events={issue.statusEvents} />
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
