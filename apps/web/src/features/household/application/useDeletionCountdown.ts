import { useEffect, useState } from 'react';
import { formatRemainingDuration } from './formatHouseholdDateTime';

export function useDeletionCountdown(executeAt: string) {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const update = () => setNow(Date.now());
    const timer = setInterval(update, 1000);
    document.addEventListener('visibilitychange', update);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', update);
    };
  }, [executeAt]);
  return {
    remaining: formatRemainingDuration(executeAt, new Date(now)),
    expired: now >= Date.parse(executeAt),
  };
}
