import { AuthSpinner } from './AuthSpinner';

type Props = {
  hasAuthError: boolean;
  isSubmitting: boolean;
  onLogin: () => void;
};

export function LoginPanel({ hasAuthError, isSubmitting, onLogin }: Props) {
  return (
    <div className="flex flex-col gap-6 text-center">
      <h2 className="auth-heading text-xl font-semibold leading-7">Đăng nhập vào Sổ Sức Khỏe Gia Đình</h2>
      {hasAuthError && (
        <p role="alert" className="rounded-lg border border-danger p-4 text-sm leading-6 text-danger">
          Không thể xác thực tài khoản. Vui lòng thử lại.
        </p>
      )}
      <button
        type="button"
        onClick={onLogin}
        disabled={isSubmitting}
        aria-busy={isSubmitting}
        className="flex min-h-[52px] w-full items-center justify-center gap-3 rounded-xl bg-accent px-4 py-3 text-base font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent disabled:cursor-wait"
      >
        {isSubmitting && <AuthSpinner />}
        {isSubmitting ? 'Đang chuyển hướng…' : hasAuthError ? 'Thử lại' : 'Đăng nhập Authentik'}
      </button>
    </div>
  );
}
