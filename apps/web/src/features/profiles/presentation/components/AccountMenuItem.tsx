import { useId } from 'react';
import { Link } from '@tanstack/react-router';
import { AccountMenuIcon } from './AccountMenuIcon';

type Props = {
  to: '/family/home' | '/my-profile' | '/account' | '/admin';
  icon: 'home' | 'profile' | 'settings' | 'account-settings';
  label: string;
  description: string;
  onClose?: (() => void) | undefined;
};

export function AccountMenuItem({ to, icon, label, description, onClose }: Props) {
  const descriptionId = useId();
  return (
    <Link to={to} onClick={onClose} aria-label={label} aria-describedby={descriptionId}>
      <AccountMenuIcon name={icon} />
      <span className="account-menu-item-copy">
        <strong>{label}</strong>
        <small id={descriptionId}>{description}</small>
      </span>
    </Link>
  );
}
