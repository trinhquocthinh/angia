import { useLocation } from '@tanstack/react-router';
import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { readInvitationToken } from '../application/readInvitationToken';
import { InvitationLayout } from './components/InvitationLayout';
import { InvitationPageContent } from './components/InvitationPageContent';
export function LinkInvitePage() {
  const { hash } = useLocation();
  const session = useCurrentSession(fetchCurrentSession);
  const token = readInvitationToken(`#${hash}`);
  if (!session.data) return null;
  return (
    <InvitationLayout>
      <InvitationPageContent
        key={token}
        token={token}
        accountName={session.data.account.displayName}
        csrfToken={session.data.csrfToken}
      />
    </InvitationLayout>
  );
}
