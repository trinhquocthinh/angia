import type { ReactNode, RefObject } from 'react';
import { useModalDialog } from './useModalDialog';
import './modal-motion.css';

type Props = {
  className: string;
  label?: string;
  labelledBy?: string;
  pending?: boolean;
  returnFocusRef?: RefObject<HTMLButtonElement | null> | undefined;
  onClose: () => void;
  children: ReactNode;
};

export function ModalSurface({
  className,
  label,
  labelledBy,
  pending = false,
  returnFocusRef,
  onClose,
  children,
}: Props) {
  const ref = useModalDialog(returnFocusRef);
  return (
    <dialog
      ref={ref}
      className={`angia-modal ${className}`}
      aria-label={label}
      aria-labelledby={labelledBy}
      onCancel={(event) => {
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        if (!pending) onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget && !pending) onClose();
      }}
    >
      {children}
    </dialog>
  );
}
