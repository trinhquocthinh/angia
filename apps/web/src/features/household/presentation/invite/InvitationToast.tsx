import { useEffect, useState } from 'react';
export function InvitationToast({ message, sequence }: { message: string; sequence: number }) {
  const [dismissed, setDismissed] = useState(0);
  useEffect(() => {
    if (!sequence) return;
    const timer = window.setTimeout(() => setDismissed(sequence), 3500);
    return () => window.clearTimeout(timer);
  }, [sequence]);
  return (
    <div className="household-invite-toast-layer" aria-live="polite" aria-atomic="true">
      {message && dismissed !== sequence && (
        <div role="status" className="household-invite-toast">
          {message}
        </div>
      )}
    </div>
  );
}
