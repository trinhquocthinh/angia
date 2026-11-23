import { useId } from 'react';
import { Button } from '@src/shared/ui/button/Button';
import { ModalSurface } from '@src/shared/ui/ModalSurface';
import type { TemporaryPasswordResult } from '../../application/memberPorts';
import { MemberClayGlyph } from './MemberClayGlyph';
import { ResetMemberPasswordConfirm } from './ResetMemberPasswordConfirm';
import { ResetMemberPasswordResult } from './ResetMemberPasswordResult';

type Props = {
  displayName: string;
  pending: boolean;
  error: string | null;
  result: TemporaryPasswordResult | null;
  onClose: () => void;
  onConfirm: () => void;
};

export function ResetMemberPasswordDialog({
  displayName,
  pending,
  error,
  result,
  onClose,
  onConfirm,
}: Props) {
  const titleId = useId();
  return (
    <ModalSurface className="member-reset-dialog" labelledBy={titleId} pending={pending} onClose={onClose}>
      <div className="member-reset-content" aria-busy={pending}>
        <span className="member-reset-handle" aria-hidden="true" />
        <Button
          variant="icon"
          className="member-reset-close"
          aria-label="Đóng đặt lại mật khẩu"
          disabled={pending}
          onClick={onClose}
        >
          <MemberClayGlyph name="home-close" size={20} />
        </Button>
        {result ? (
          <ResetMemberPasswordResult
            titleId={titleId}
            displayName={displayName}
            result={result}
            onClose={onClose}
          />
        ) : (
          <ResetMemberPasswordConfirm
            titleId={titleId}
            displayName={displayName}
            pending={pending}
            error={error}
            onClose={onClose}
            onConfirm={onConfirm}
          />
        )}
      </div>
    </ModalSurface>
  );
}
