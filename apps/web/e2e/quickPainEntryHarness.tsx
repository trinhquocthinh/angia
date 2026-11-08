import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PainJournalWorkspace } from '../src/features/painJournal/presentation/PainJournalTab/PainJournalWorkspace';
import { profile, session } from '../src/features/painJournal/test/painIssues.test-helper';
import '../src/app/styles.css';

function Harness() {
  const [tab, setTab] = useState(false);
  const [consent, setConsent] = useState(true);
  const [scope, setScope] = useState<'main' | 'self'>('main');
  const [account, setAccount] = useState('a');
  return (
    <>
      <button type="button" onClick={() => setTab(true)}>
        Đau nhức
      </button>
      <button type="button" onClick={() => setConsent(false)}>
        Rút đồng thuận
      </button>
      <button
        type="button"
        onClick={() => {
          setScope('self');
          setTab(true);
        }}
      >
        Dùng self
      </button>
      <button type="button" onClick={() => setAccount((current) => (current === 'a' ? 'other' : 'a'))}>
        Đổi tài khoản
      </button>
      {tab && (
        <PainJournalWorkspace
          session={{
            ...session,
            role: scope === 'self' ? 'member' : 'main',
            account: { ...session.account, id: account },
          }}
          profile={{ ...profile, consentStatus: consent ? 'confirmed' : 'withdrawn' }}
          scope={scope}
        />
      )}
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <Harness />
  </QueryClientProvider>,
);
