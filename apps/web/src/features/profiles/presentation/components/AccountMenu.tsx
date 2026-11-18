import { lazy, Suspense, useId, useState } from 'react';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { roleLabel } from './roleLabel';
import type { AccountMenuProps } from './accountMenuTypes';
import './account-menu.css';

const AccountMenuSurface = lazy(() =>
  import('./AccountMenuSurface').then((module) => ({ default: module.AccountMenuSurface })),
);
export function AccountMenu(props: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState({ top: 68, right: 16 });
  const panelId = useId();
  return (
    <div className="relative">
      <button
        type="button"
        aria-label="Tài khoản"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={panelId}
        className="account-menu-trigger"
        onClick={(event) => {
          event.currentTarget.focus();
          const box = event.currentTarget.getBoundingClientRect();
          setAnchor({ top: box.bottom + 8, right: Math.max(16, innerWidth - box.right) });
          setOpen((value) => !value);
        }}
      >
        <span className="account-menu-trigger-avatar">
          <AdminIcon name="person" size={18} />
        </span>
        <span className="account-menu-trigger-name">
          <strong>{props.session.account.displayName}</strong>
          <span>
            <i />
            {roleLabel(props.session.role)}
          </span>
        </span>
        <span className="account-menu-trigger-chevron" data-open={open}>
          <AdminIcon name="expand_more" size={18} />
        </span>
      </button>
      {open && (
        <Suspense fallback={null}>
          <AccountMenuSurface {...props} anchor={anchor} panelId={panelId} onClose={() => setOpen(false)} />
        </Suspense>
      )}
    </div>
  );
}
