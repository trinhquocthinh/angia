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
        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl p-1 transition-colors hover:bg-[#eaf6f5] focus-visible:outline-2 focus-visible:outline-[#286958] lg:px-1.5"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#20594b] text-white shadow-[0_2px_8px_rgba(32,89,75,0.3)] ring-2 ring-[#004135]/20 lg:h-8 lg:w-8 lg:bg-[#004135] lg:shadow-sm lg:ring-0">
          <AdminIcon name="person" size={18} />
        </span>
        <span className="hidden max-w-40 flex-col text-left lg:flex">
          <span className="truncate text-xs leading-tight font-semibold text-[#131d1d]">
            {session.account.displayName}
          </span>
          <span className="truncate text-[11px] leading-none text-[#404945]">{role}</span>
        </span>
        <span
          className={`hidden text-[#707975] transition-transform duration-200 lg:inline-flex ${open ? 'rotate-180' : ''}`}
        >
          <AdminIcon name="expand_more" size={18} />
        </span>
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute top-full right-0 z-50 mt-2 flex w-[17rem] max-w-[calc(100vw-2rem)] flex-col rounded-2xl border border-[#bfc9c4]/30 bg-white py-2 shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
        >
          <AccountMenuPanel session={session} pending={pending} error={error} onLogout={onLogout} />
        </div>
      )}
    </div>
  );
}
