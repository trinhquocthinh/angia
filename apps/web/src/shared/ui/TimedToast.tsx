import { useEffect, useState } from 'react';

export function TimedToast({
  message,
  sequence,
  className,
}: {
  message: string;
  sequence: number;
  className: string;
}) {
  const [dismissed, setDismissed] = useState(0);

  useEffect(() => {
    if (!sequence) return;
    const timer = window.setTimeout(() => setDismissed(sequence), 4000);
    return () => window.clearTimeout(timer);
  }, [sequence]);

  return (
    <div className={`${className}-layer`} aria-live="polite" aria-atomic="true">
      {message && dismissed !== sequence && (
        <div role="status" className={className}>
          {message}
        </div>
      )}
    </div>
  );
}
