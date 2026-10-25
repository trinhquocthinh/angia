import type { CSSProperties } from 'react';

export type AdminIconName =
  | 'add_a_photo'
  | 'all_inclusive'
  | 'check'
  | 'close'
  | 'edit'
  | 'expand_more'
  | 'family_restroom'
  | 'folder_shared'
  | 'group'
  | 'group_add'
  | 'home_health'
  | 'info'
  | 'logout'
  | 'manage_accounts'
  | 'notifications'
  | 'pending_actions'
  | 'person'
  | 'person_add'
  | 'person_remove'
  | 'search'
  | 'settings'
  | 'shield'
  | 'verified_user';

export function AdminIcon({ name, size = 20 }: { name: AdminIconName; size?: number }) {
  return (
    <span
      className="admin-icon text-[length:var(--icon-size)] font-normal not-italic leading-[1] tracking-[normal] normal-case inline-block whitespace-nowrap [word-wrap:normal] [direction:ltr] antialiased shrink-0"
      style={{ '--icon-size': `${size}px` } as CSSProperties}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
