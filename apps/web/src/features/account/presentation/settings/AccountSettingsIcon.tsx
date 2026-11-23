export type AccountMaskIconName =
  | 'check_circle'
  | 'warning'
  | 'error'
  | 'info'
  | 'edit'
  | 'refresh'
  | 'mark_email_read'
  | 'send'
  | 'light_mode'
  | 'dark_mode'
  | 'settings_brightness';

export function AccountSettingsIcon({
  name,
  className = '',
}: {
  name: AccountMaskIconName;
  className?: string;
}) {
  const source = `url('/images/household/stitch/account-${name}.svg')`;
  const classes = className ? `account-mask-icon ${className}` : 'account-mask-icon';
  return (
    <span className={classes} aria-hidden="true" style={{ maskImage: source, WebkitMaskImage: source }} />
  );
}
