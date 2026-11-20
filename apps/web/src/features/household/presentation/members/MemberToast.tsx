import { useEffect, useState } from 'react';
import './member-toast.css';

export function MemberToast({ message, sequence }: { message: string; sequence: number }) {
  const [dismissed, setDismissed] = useState(0);
  useEffect(() => {
    if (!sequence) return;
    const timer = window.setTimeout(() => setDismissed(sequence), 4000);
    return () => window.clearTimeout(timer);
  }, [sequence]);

  return (
    <div className="household-members-toast-layer" aria-live="polite" aria-atomic="true">
      {message && dismissed !== sequence && (
        <div role="status" className="household-members-toast">
          {message}
        </div>
      )}
    </div>
  );
}
