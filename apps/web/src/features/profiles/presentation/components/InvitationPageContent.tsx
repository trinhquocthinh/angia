import { useLinkInvitation } from '../../application/useLinkInvitation';
import { createInvitationRepository } from '../../infrastructure/createInvitationRepository';
import { InvitationContent } from './InvitationContent';
const repository = createInvitationRepository();
export function InvitationPageContent({
  token,
  accountName,
  csrfToken,
}: {
  token: string | null;
  accountName: string;
  csrfToken: string;
}) {
  const workspace = useLinkInvitation(repository, token, csrfToken);
  return <InvitationContent workspace={workspace} accountName={accountName} />;
}
