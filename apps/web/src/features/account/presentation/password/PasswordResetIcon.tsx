type IconName = 'mail' | 'arrow_back' | 'arrow_forward' | 'cancel' | 'error' | 'mark_email_read';

export function PasswordResetIcon({ name }: { name: IconName }) {
  const source = `url('/images/household/stitch/forgot-${name}.svg')`;
  return (
    <span className="forgot-icon" aria-hidden="true" style={{ maskImage: source, WebkitMaskImage: source }} />
  );
}
