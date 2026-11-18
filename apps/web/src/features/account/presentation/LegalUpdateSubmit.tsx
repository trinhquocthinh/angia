import { Button } from '@src/shared/ui/button/Button';
import { AuthSpinner } from '@src/features/auth/presentation/components/AuthSpinner';
import { LegalUpdateIcon } from './LegalUpdateIcon';

export function LegalUpdateSubmit({ busy, disabled }: { busy: boolean; disabled: boolean }) {
  return (
    <Button type="submit" disabled={busy || disabled} className="legal-update-submit">
      {busy && <AuthSpinner />}
      {busy ? 'Đang gửi…' : 'Đồng ý và tiếp tục'}
      {!busy && <LegalUpdateIcon name="arrow" />}
    </Button>
  );
}
