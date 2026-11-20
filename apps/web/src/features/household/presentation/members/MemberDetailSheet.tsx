import { MemberClayGlyph } from './MemberClayGlyph';
import { type ReactNode, type RefObject } from 'react';
import { Button } from '@src/shared/ui/button/Button';
import { ModalSurface } from '@src/shared/ui/ModalSurface';

type Props = {
  pending?: boolean;
  returnFocusRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  children: ReactNode;
};

export function MemberDetailSheet({ onClose, returnFocusRef, children, pending = false }: Props) {
  return (
    <ModalSurface
      className="household-member-sheet"
      label="Chi tiết thành viên"
      returnFocusRef={returnFocusRef}
      pending={pending}
      onClose={onClose}
    >
      <div className="household-member-sheet-body">
        <div className="household-member-sheet-bar">
          <span className="household-member-sheet-handle" aria-hidden="true" />
          <Button
            disabled={pending}
            data-autofocus
            variant="icon"
            className="household-member-sheet-close"
            aria-label="Đóng chi tiết thành viên"
            onClick={onClose}
          >
            <MemberClayGlyph name="home-close" size={20} />
          </Button>
        </div>
        {children}
      </div>
    </ModalSurface>
  );
}
