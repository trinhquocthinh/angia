import { useEffect, useRef } from 'react';

export function VerifyEmailPending() {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <div className="verify-state verify-pending">
      <div className="verify-badge" aria-hidden="true">
        <span className="verify-spinner" />
      </div>
      <h2
        id="verify-title"
        ref={heading}
        tabIndex={-1}
        className="verify-pending-title"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        Đang xác minh email của bạn…
      </h2>
      <div className="verify-dots" aria-hidden="true">
        <span />
        <span />
        <span />
      </div>
    </div>
  );
}
