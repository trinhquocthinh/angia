import { AuthLayout } from './AuthLayout';
import { AuthSpinner } from './AuthSpinner';

type Props = { state: 'loading' } | { state: 'error'; onRetry: () => void };

export function SessionStatus(props: Props) {
  return (
    <AuthLayout>
      {props.state === 'loading' ? (
        <p role="status" className="flex items-center justify-center gap-3 text-base text-text-secondary">
          <AuthSpinner /> Đang kiểm tra phiên…
        </p>
      ) : (
        <div className="flex flex-col gap-6 text-center">
          <p role="alert" className="text-base leading-7 text-danger">
            Không thể kiểm tra phiên. Vui lòng thử lại.
          </p>
          <button
            type="button"
            onClick={props.onRetry}
            className="min-h-[52px] rounded-xl bg-accent px-4 py-3 font-semibold text-on-accent hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-accent"
          >
            Thử lại
          </button>
        </div>
      )}
    </AuthLayout>
  );
}
