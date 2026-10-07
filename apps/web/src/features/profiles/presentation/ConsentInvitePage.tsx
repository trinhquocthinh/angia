import { useLocation } from '@tanstack/react-router';
import { InvitationLayout } from './components/InvitationLayout';
import { readInvitationToken } from '../application/readInvitationToken';
import { InvitationPageContent } from './components/InvitationPageContent';
export function ConsentInvitePage() {
  const { hash } = useLocation();
  const token = readInvitationToken(`#${hash}`);
  return (
    <InvitationLayout>
      <InvitationPageContent key={token} token={token} />
    </InvitationLayout>
  );
}
