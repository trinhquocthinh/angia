import { Button } from '@src/shared/ui/button/Button';
import { AuthSpinner } from '@src/features/auth/presentation/components/AuthSpinner';
export function AccountSubmitButton({
  busy,
  disabled,
  label,
  pending,
}: {
  busy: boolean;
  disabled?: boolean;
  label: string;
  pending: string;
}) {
  return (
    <Button type="submit" disabled={busy || disabled} className="w-full">
      {busy && <AuthSpinner />}
      {busy ? pending : label}
    </Button>
  );
}
