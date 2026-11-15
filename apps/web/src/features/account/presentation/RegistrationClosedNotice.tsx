import { accountErrorMessage } from '../application/accountErrorMessage';
export function RegistrationClosedNotice() {
  return (
    <p
      role="status"
      className="mb-6 flex items-start gap-3 rounded-xl border border-border bg-bg p-4 text-lg leading-7 text-text-primary"
    >
      <svg
        aria-hidden="true"
        className="mt-1 shrink-0"
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v6m0-10v1" />
      </svg>
      <span>{accountErrorMessage('ERR_REGISTRATION_CLOSED')}</span>
    </p>
  );
}
