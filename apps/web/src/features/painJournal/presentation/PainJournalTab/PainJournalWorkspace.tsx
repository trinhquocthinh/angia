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
};
export function PainJournalWorkspace({ session, profile, scope = 'main', ...actions }: Props) {
  const query = usePainIssues(api, session, profile, scope);
  return (
    <PainJournalTab
      issues={query.data?.issues}
      error={query.error}
      consentConfirmed={profile.consentStatus === 'confirmed'}
      retry={() => {
        void query.refetch();
      }}
      {...actions}
    />
  );
}
