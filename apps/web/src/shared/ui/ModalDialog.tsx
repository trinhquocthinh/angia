import type { ReactNode } from 'react';
import { useModalDialog } from './useModalDialog';
import './modal-motion.css';

type Props = {
  labelledBy: string;
  role?: 'dialog' | 'alertdialog';
  /** Escape gọi hàm này; khi đang lưu thì không đóng. */
  onCancel: () => void;
  pending: boolean;
  width: 'md' | 'lg';
  children: ReactNode;
};

const WIDTHS = { md: 'md:w-[min(540px,calc(100vw-32px))]', lg: 'md:w-[min(640px,calc(100vw-32px))]' };

// Hộp thoại theo Stitch 369b16ad/6ea48325: giữa màn hình ở desktop, bottom sheet ở mobile (Stitch 4f573bdf/bf67ecac).
// Trả focus về phần tử đã mở khi đóng.
export function ModalDialog({ labelledBy, role = 'dialog', onCancel, pending, width, children }: Props) {
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
      className={`angia-modal max-h-[calc(100dvh-32px)] flex-col overflow-hidden border-0 bg-white p-0 text-[#131d1d] shadow-[0_24px_80px_#00413533] backdrop:bg-[#00201966] backdrop:backdrop-blur-[3px] open:flex md:m-auto md:rounded-[24px] max-md:inset-x-0 max-md:top-auto max-md:bottom-0 max-md:m-0 max-md:max-h-[92dvh] max-md:w-full max-md:max-w-full max-md:rounded-t-[24px] ${WIDTHS[width]}`}
    >
      <span
        aria-hidden="true"
        className="mx-auto mt-2.5 h-1.5 w-10 shrink-0 rounded-full bg-[#d9e5e4] md:hidden"
      />
      {children}
    </dialog>
  );
}
