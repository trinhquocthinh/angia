import { painIssueWriteKey } from '../../application/painIssueWriteKey';
import { canWritePainIssue } from '../../application/canWritePainIssue';
import { usePainIssues } from '../../application/usePainIssues';
import { createPainJournalApi } from '../../infrastructure/painJournalApi';
import { usePainJournalDialogs } from './usePainJournalDialogs';
import type { PainWorkspaceProps } from './painJournalWorkspaceTypes';
import { PainJournalTab } from './PainJournalTab';
import { PainJournalDialogs } from './PainJournalDialogs';
const api = createPainJournalApi();
export function PainJournalWorkspaceContent({
  session,
  profile,
  scope = 'main',
  onContinueIssue,
  ...actions
}: PainWorkspaceProps) {
  const query = usePainIssues(api, session, profile, scope);
  const identity = painIssueWriteKey(session, profile, scope);
  const allowed = canWritePainIssue(session, profile, scope);
  const { opened, notice, show, saved, handoff, close } = usePainJournalDialogs(identity, onContinueIssue);
  return (
    <>
      <PainJournalTab
        issues={query.data?.issues}
        error={query.error}
        consentConfirmed={profile.consentStatus === 'confirmed'}
        retry={() => {
          void query.refetch();
        }}
        {...actions}
        onRecord={
          allowed && query.data && !query.error
            ? (actions.onRecord ?? ((issue) => show({ kind: 'record', issue })))
            : undefined
        }
        onCreate={
          allowed && query.data && !query.error
            ? (actions.onCreate ?? (() => show({ kind: 'create', issues: query.data!.issues })))
            : undefined
        }
      />
      {notice?.key === identity && allowed && <p role="status">{notice.message}</p>}
      {opened?.key === identity && allowed && !query.error && (
        <PainJournalDialogs
          key={`${identity}:${session.csrfToken}`}
          session={session}
          profile={profile}
          scope={scope}
          dialog={opened.dialog}
          onClose={close}
          onSaved={saved}
          onContinueIssue={handoff}
        />
      )}
    </>
  );
}
