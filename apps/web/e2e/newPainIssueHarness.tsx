import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NewPainIssueSheet } from '../src/features/painJournal/presentation/NewPainIssueSheet/NewPainIssueSheet';
import { PainJournalWorkspace } from '../src/features/painJournal/presentation/PainJournalTab/PainJournalWorkspace';
import { createPainJournalApi } from '../src/features/painJournal/infrastructure/painJournalApi';
import type { PainIssueHandoff } from '../src/features/painJournal/application/painIssueHandoff';
import { issue, profile, session } from '../src/features/painJournal/test/painIssues.test-helper';
import '../src/app/styles.css';
const api = createPainJournalApi();
function Harness() {
  const [open, setOpen] = useState(false);
  const [handoff, setHandoff] = useState<PainIssueHandoff | null>(null);
  const [consent, setConsent] = useState(true);
  const [scope, setScope] = useState<'main' | 'self'>('main');
  const complete = (result: PainIssueHandoff) => {
    setHandoff(result);
    setOpen(false);
  };
  if (new URLSearchParams(location.search).has('workspace'))
    return <PainJournalWorkspace profile={profile} session={session} onContinueIssue={complete} />;
  return (
    <>
      <button onClick={() => setOpen(true)}>Mở sheet</button>
      <button onClick={() => setConsent(false)}>Rút đồng thuận</button>
      <button onClick={() => setScope('self')}>Dùng self</button>
      {open && (
        <NewPainIssueSheet
          key={scope}
          api={api}
          session={session}
          profile={{ ...profile, consentStatus: consent ? 'confirmed' : 'withdrawn' }}
          scope={scope}
          issues={[issue]}
          onClose={() => setOpen(false)}
          onContinueIssue={complete}
        />
      )}
      <output data-testid="handoff">{JSON.stringify(handoff)}</output>
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={new QueryClient()}>
    <Harness />
  </QueryClientProvider>,
);
