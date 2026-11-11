import type { ReactNode } from 'react';
import { useModalDialog } from '../useModalDialog';
import '../modal-motion.css';

type Props = {
  labelledBy: string;
  role?: 'dialog' | 'alertdialog';
  onCancel: () => void;
  pending: boolean;
  width?: 'md' | 'lg' | 'xl';
  placement?: 'modal' | 'side';
  children: ReactNode;
};

const WIDTHS = {
  md: 'md:w-[min(540px,calc(100vw-32px))]',
  lg: 'md:w-[min(640px,calc(100vw-32px))]',
  xl: 'md:w-[min(720px,calc(100vw-32px))]',
};
const PLACEMENTS = {
  modal:
    'max-h-[calc(100dvh-32px)] md:m-auto md:rounded-[20px] max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:m-0 max-md:max-h-[92dvh] max-md:w-full max-md:max-w-full max-md:rounded-t-[20px]',
  side: 'angia-side fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-[490px] max-w-full max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:h-auto max-md:max-h-[90dvh] max-md:w-full max-md:rounded-t-[20px]',
};

/** Native dialog giữ focus trap; pending chặn Escape, hook trả focus khi tháo. */
export function Sheet({
  labelledBy,
  role = 'dialog',
  onCancel,
  pending,
  width = 'md',
  placement = 'modal',
  children,
}: Props) {
  const ref = useModalDialog();
  return (
    <dialog
      ref={ref}
      role={role}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        event.preventDefault();
        if (!pending) onCancel();
      }}
      className={`angia-modal flex-col overflow-x-hidden overflow-y-auto border border-border bg-surface p-0 font-sans text-lg leading-7 text-text-primary backdrop:bg-overlay/40 open:flex ${PLACEMENTS[placement]} ${placement === 'modal' ? WIDTHS[width] : ''}`}
    >
      {placement === 'modal' && (
        <span
          aria-hidden="true"
          className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-border md:hidden"
        />
      )}
      {children}
    </dialog>
  );
}
