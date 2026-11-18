import { useRef, useState } from 'react';
import { invitationErrorMessage } from './invitationErrorMessage';
import type { CreateInvitation, InvitationRole, IssuedInvitation } from './invitationPorts';

export function useInvitationIssuer(create: CreateInvitation, csrfToken: string) {
  const [invitation, setInvitation] = useState<IssuedInvitation | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const locked = useRef(false);
  const issued = useRef(false);
  async function issue(role: InvitationRole) {
    if (locked.current || issued.current || !csrfToken) return;
    locked.current = true;
    setPending(true);
    setError(null);
    try {
      const result = await create({ kind: 'join_family', role }, csrfToken);
      if (result.ok) {
        issued.current = true;
        const invitation = { ...result.value, role };
        setInvitation(invitation);
        return invitation;
      } else setError(invitationErrorMessage(result.code));
    } catch {
      setError(invitationErrorMessage('NETWORK'));
    } finally {
      locked.current = false;
      setPending(false);
    }
  }
  function reset() {
    if (locked.current) return;
    issued.current = false;
    setInvitation(null);
    setError(null);
  }
  return { invitation, pending, error, issue, reset };
}
