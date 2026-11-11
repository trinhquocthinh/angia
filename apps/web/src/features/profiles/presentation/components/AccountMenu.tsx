import { useId, useRef, useState } from 'react';
import { useDismiss } from './useDismiss';
import { AccountMenuPanel } from './AccountMenuPanel';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import type { ProfileSession } from '../../application/ports';
import { roleLabel } from './roleLabel';

// Menu tài khoản trên header (desktop + di động): định danh, quản trị hệ thống, đăng xuất.
export function AccountMenu({
  session,
  pending,
  error,
  onLogout,
}: {
  session: ProfileSession;
  pending: boolean;
  error: boolean;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const panelId = useId();
  useDismiss(open, root, () => setOpen(false));
  const role = roleLabel(session.role);
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="Tài khoản"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl p-1 transition-colors hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-focus lg:px-1.5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-on-accent shadow-[0_2px_8px_color-mix(in_srgb,var(--color-shadow)_30%,transparent)] ring-2 ring-focus/20 lg:h-8 lg:w-8 lg:bg-accent lg:shadow-sm lg:ring-0">
          <AdminIcon name="person" size={18} />
        </span>
        <span className="hidden max-w-40 flex-col text-left lg:flex">
          <span className="truncate text-xs leading-tight font-semibold text-text-primary">
            {session.account.displayName}
          </span>
          <span className="truncate text-[11px] leading-none text-text-secondary">{role}</span>
        </span>
        <span
          className={`hidden text-text-secondary transition-transform duration-200 lg:inline-flex ${open ? 'rotate-180' : ''}`}
        >
          <AdminIcon name="expand_more" size={18} />
        </span>
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute top-full right-0 z-50 mt-2 flex w-[17rem] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-border/30 bg-surface py-2 shadow-[0_12px_32px_color-mix(in_srgb,var(--color-shadow)_12%,transparent)]"
        >
          <AccountMenuPanel session={session} pending={pending} error={error} onLogout={onLogout} />
        </div>
      )}
    </div>
  );
}
