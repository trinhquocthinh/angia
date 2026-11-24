import { PasswordResetIcon } from '@src/features/account/presentation/password/PasswordResetIcon';

export function PasswordResetAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p role="alert" className="forgot-alert">
      <PasswordResetIcon name="error" />
      <span>{message}</span>
    </p>
  );
}
