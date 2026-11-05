import type { CSSProperties } from 'react';

// Mỗi tên phải có trong bản subset public/fonts/material-symbols/outlined.woff2 (Google Fonts `icon_names`).
export type AdminIconName =
  | 'account_circle'
  | 'add'
  | 'add_a_photo'
  | 'admin_panel_settings'
  | 'all_inclusive'
  | 'arrow_back'
  | 'arrow_forward'
  | 'arrow_outward'
  | 'badge'
  | 'check'
  | 'check_circle'
  | 'chevron_right'
  | 'close'
  | 'delete'
  | 'delete_outline'
  | 'edit'
  | 'expand_more'
  | 'family_restroom'
  | 'folder_shared'
  | 'group'
  | 'group_add'
  | 'help'
  | 'home_health'
  | 'info'
  | 'logout'
  | 'manage_accounts'
  | 'menu_book'
  | 'notifications'
  | 'pending_actions'
  | 'person'
  | 'person_add'
  | 'person_remove'
  | 'search'
  | 'settings'
  | 'shield'
  | 'upload_file'
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
