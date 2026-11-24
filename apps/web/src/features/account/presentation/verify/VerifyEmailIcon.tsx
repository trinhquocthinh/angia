type VerifyIconName =
  'verify-check' | 'verify-lock' | 'verify-clock' | 'verify-warning' | 'verify-arrow-right';

export function VerifyEmailIcon({ name, className }: { name: VerifyIconName; className?: string }) {
  const source = `url('/images/household/stitch/${name}.svg')`;
  const classes = className ? `verify-icon ${className}` : 'verify-icon';
  return (
    <span className={classes} aria-hidden="true" style={{ maskImage: source, WebkitMaskImage: source }} />
  );
}
