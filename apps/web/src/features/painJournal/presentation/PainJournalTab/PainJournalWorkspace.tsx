import { painIssueWriteKey } from '../../application/painIssueWriteKey';
import { useState } from 'react';
import type { PainIssueSummary } from '@angia/contracts';
import type { PainIssueHandoff } from '../../application/painIssueHandoff';
import { canWritePainIssue } from '../../application/canWritePainIssue';
import { NewPainIssueSheet } from '../NewPainIssueSheet/NewPainIssueSheet';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { usePainIssues } from '../../application/usePainIssues';
import { createPainJournalApi } from '../../infrastructure/painJournalApi';
import type { PainJournalActions } from './painJournalActions';
import { PainJournalTab } from './PainJournalTab';

const api = createPainJournalApi();
type Props = PainJournalActions & {
  session: ProfileSession;
  profile: HealthProfile;
  scope?: 'main' | 'self';
  onContinueIssue?: (handoff: PainIssueHandoff) => void;
};
export function PainJournalWorkspace({
  session,
  profile,
  scope = 'main',
  onContinueIssue,
  ...actions
}: Props) {
  const query = usePainIssues(api, session, profile, scope);
  const [creating, setCreating] = useState<{ key: string; issues: PainIssueSummary[] } | null>(null);
  const identity = painIssueWriteKey(session, profile, scope);
  const allowed = canWritePainIssue(session, profile, scope);
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
        onCreate={
          actions.onCreate ??
          (onContinueIssue && query.data && allowed
            ? () => setCreating({ key: identity, issues: query.data!.issues })
            : undefined)
        }
      />
      {creating?.key === identity && allowed && !query.error && onContinueIssue && (
        <NewPainIssueSheet
          key={`${session.account.id}:${session.family?.id}:${profile.id}:${scope}`}
          api={api}
          session={session}
          profile={profile}
          scope={scope}
          issues={creating.issues}
          onClose={() => setCreating(null)}
          onContinueIssue={(result) => {
            setCreating(null);
            onContinueIssue(result);
          }}
        />
      )}
    </>
  );
}
