import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { useModalDialog } from '@src/shared/ui/useModalDialog';
import { AccountMenuPanel } from './AccountMenuPanel';
import type { AccountMenuAnchor, AccountMenuProps } from './accountMenuTypes';
export function AccountMenuSurface({
  anchor,
  panelId,
  onClose,
  ...props
}: AccountMenuProps & { anchor: AccountMenuAnchor; panelId: string; onClose: () => void }) {
  const ref = useModalDialog();
  const [closing, setClosing] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const previous = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = previous;
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  function close() {
    if (closing) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return onClose();
    setClosing(true);
    timer.current = setTimeout(onClose, 300);
  }
  return createPortal(
    <dialog
      ref={ref}
      id={panelId}
      aria-label="Tài khoản"
      className="account-menu-surface"
      data-closing={closing || undefined}
      style={
        {
          '--account-menu-top': `${anchor.top}px`,
          '--account-menu-right': `${anchor.right}px`,
        } as CSSProperties
      }
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        if (
          event.target === event.currentTarget &&
          (event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom)
        )
          close();
      }}
    >
      <div className="account-menu-handle" aria-hidden="true">
        <span />
      </div>
      <AccountMenuPanel {...props} onClose={close} />
    </dialog>,
    document.body,
  );
}
