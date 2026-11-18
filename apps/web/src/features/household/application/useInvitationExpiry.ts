import { useEffect, useState } from 'react';
import { invitationIsExpired } from './invitationIsExpired';

export function useInvitationExpiry(expiresAt: string | undefined) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => setNow(Date.now());
    const delay = Date.parse(expiresAt) - Date.now();
    const timer = setTimeout(update, Math.min(2_147_483_647, Math.max(0, delay)));
    document.addEventListener('visibilitychange', update);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, [expiresAt]);
  return expiresAt ? invitationIsExpired(expiresAt, now) : false;
}
