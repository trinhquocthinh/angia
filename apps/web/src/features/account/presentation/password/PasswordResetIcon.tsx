type ForgotIconName = 'mail' | 'arrow_back' | 'arrow_forward' | 'cancel' | 'error' | 'mark_email_read';
type ResetIconName =
  'reset-key' | 'reset-lock_clock' | 'reset-verified' | 'reset-refresh' | 'reset-arrow_forward';

export function PasswordResetIcon({ name }: { name: ForgotIconName | ResetIconName }) {
  const file = name.startsWith('reset-') ? name : `forgot-${name}`;
  const source = `url('/images/household/stitch/${file}.svg')`;
  return (
    <span className="forgot-icon" aria-hidden="true" style={{ maskImage: source, WebkitMaskImage: source }} />
  );
}
