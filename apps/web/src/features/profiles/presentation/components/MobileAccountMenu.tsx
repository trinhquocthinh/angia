import { useEffect, useId, useRef, useState } from 'react';
import type { ProfileSession } from '../../application/ports';
import { ProfileAccountFooter } from './ProfileAccountFooter';

// Avatar ở header di động: mở thẻ tài khoản (quản trị, đăng xuất) vốn nằm cuối sidebar trên desktop.
export function MobileAccountMenu({
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
  useEffect(() => {
    if (!open) return;
    const close = (event: Event) => {
      if (
        event instanceof KeyboardEvent
          ? event.key === 'Escape'
          : !root.current?.contains(event.target as Node)
      )
        setOpen(false);
    };
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', close);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', close);
    };
  }, [open]);
  return (
    <div ref={root} className="relative">
      <button
        type="button"
        aria-label="Tài khoản"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-[#286958]"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#004135] text-sm font-semibold text-white">
          {session.account.displayName.slice(0, 1).toLocaleUpperCase('vi')}
        </span>
      </button>
      {open && (
        <div
          id={panelId}
          className="absolute top-full right-0 z-50 mt-1 w-72 max-w-[calc(100vw-2rem)] rounded-2xl shadow-[0_8px_24px_rgba(22,62,52,0.16)] [&>div]:mt-0"
        >
          <ProfileAccountFooter session={session} pending={pending} error={error} onLogout={onLogout} />
        </div>
      )}
    </div>
  );
}
