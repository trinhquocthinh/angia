import type { CSSProperties } from 'react';

// Icon save dùng SVG nội tuyến; các tên còn lại phải có trong bản subset public/fonts/material-symbols/outlined.woff2 (Google Fonts `icon_names`).
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
  | 'save'
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
      {name === 'save' ? (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7l-4-4ZM7 5h8v4H7V5Zm5 14a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
        </svg>
      ) : (
        name
      )}
    </span>
  );
}
