import { useLayoutEffect, type ReactNode, type RefObject } from 'react';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { Button } from '@src/shared/ui/button/Button';
import { useModalDialog } from '@src/shared/ui/useModalDialog';
import '@src/shared/ui/modal-motion.css';

type Props = {
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: ReactNode;
};

export function MemberDetailSheet({ onClose, returnFocusRef, children }: Props) {
  useLayoutEffect(() => {
    returnFocusRef.current?.focus();
  }, [returnFocusRef]);
  const ref = useModalDialog();

  return (
    <dialog
      ref={ref}
      className="angia-modal household-member-sheet"
      aria-label="Chi tiết thành viên"
      onCancel={(event) => {
        // React nổi bọt sự kiện cancel của hộp xác nhận lồng bên trong; chỉ đóng khi Escape nhắm đúng sheet.
        if (event.target !== event.currentTarget) return;
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="household-member-sheet-body">
        <div className="household-member-sheet-bar">
          <span className="household-member-sheet-handle" aria-hidden="true" />
          <Button
            data-autofocus
            variant="icon"
            className="household-member-sheet-close"
            aria-label="Đóng chi tiết thành viên"
            onClick={onClose}
          >
            <AdminIcon name="close" size={20} />
          </Button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
