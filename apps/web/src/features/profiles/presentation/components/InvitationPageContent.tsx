import { useConsentInvitation } from '../../application/useConsentInvitation';
import { createInvitationRepository } from '../../infrastructure/createInvitationRepository';
import { InvitationContent } from './InvitationContent';
const repository = createInvitationRepository();
export function InvitationPageContent({ token }: { token: string | null }) {
  const workspace = useConsentInvitation(repository, token);
  return <InvitationContent workspace={workspace} />;
}
