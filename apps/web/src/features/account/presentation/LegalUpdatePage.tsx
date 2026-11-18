import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import { CURRENT_SESSION_KEY, useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { accountErrorMessage } from '../application/accountErrorMessage';
import { useLegalDocuments } from '../application/useLegalDocuments';
import { fetchCurrentLegal } from '../infrastructure/fetchCurrentLegal';
import { submitAccountAction } from '../infrastructure/submitAccountAction';
import { LegalUpdateView } from './LegalUpdateView';
export function LegalUpdatePage() {
  const session = useCurrentSession(fetchCurrentSession);
  const documents = useLegalDocuments(fetchCurrentLegal);
  const client = useQueryClient();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const token = session.data?.csrfToken ?? '';
  async function submit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!documents.legal || !token || busy || documents.loading) return;
    setBusy(true);
    setError(null);
    try {
      const { terms, privacy } = documents.legal;
      const result = await submitAccountAction(
        '/api/me/legal-acceptances',
        { versionIds: [terms.id, privacy.id] },
        token,
      );
      if (result.ok) {
        await client.invalidateQueries({ queryKey: CURRENT_SESSION_KEY });
        await navigate({ to: '/' });
      } else {
        setError(accountErrorMessage(result.code));
        if (result.code === 'ERR_LEGAL_VERSION_OUTDATED') await documents.refresh(result.current);
      }
    } finally {
      setBusy(false);
    }
  }
  return (
    <LegalUpdateView
      legal={documents.legal}
      loading={documents.loading}
      token={token}
      busy={busy}
      error={documents.error ?? error}
      onSubmit={submit}
    />
  );
}
