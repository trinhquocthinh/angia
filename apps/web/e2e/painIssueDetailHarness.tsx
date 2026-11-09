import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PainIssueDetail } from '../src/features/painJournal/presentation/PainIssueDetail/PainIssueDetail';
import { profile, session, issue } from '../src/features/painJournal/test/painIssues.test-helper';
import '../src/app/styles.css';
function Harness() {
  const [scope, setScope] = useState<'main' | 'self'>('main');
  const [account, setAccount] = useState('a');
  const [consent, setConsent] = useState(true);
  const [opened, setOpened] = useState<string | null>(issue.id);
  return (
    <>
      <button type="button" onClick={() => setScope('self')}>
        Dùng self
      </button>
      <button type="button" onClick={() => setAccount((v) => (v === 'a' ? 'other' : 'a'))}>
        Đổi tài khoản
      </button>
      <button type="button" onClick={() => setConsent(false)}>
        Rút đồng thuận
      </button>
      {opened ? (
        <PainIssueDetail
          session={{
            ...session,
            role: scope === 'self' ? 'member' : 'main',
            account: { ...session.account, id: account },
          }}
          profile={{ ...profile, consentStatus: consent ? 'confirmed' : 'withdrawn' }}
          scope={scope}
          issueId={opened}
          onBack={() => setOpened(null)}
          onOpenIssue={setOpened}
        />
      ) : (
        <p>Đã về danh sách</p>
      )}
    </>
  );
}
createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <Harness />
  </QueryClientProvider>,
);
