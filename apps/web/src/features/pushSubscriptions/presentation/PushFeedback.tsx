import type { usePushSettings } from '../application/usePushSettings';
import { detectIosBrowser } from '../infrastructure/detectIosBrowser';
import { getPushSupport } from '../infrastructure/getPushSupport';
import { IosInstallGuide } from './IosInstallGuide';

type Settings = ReturnType<typeof usePushSettings>;

// Hướng dẫn hỗ trợ, lỗi đọc cấu hình và kết quả thao tác gần nhất (vùng aria-live).
export function PushFeedback({ config, action }: Settings) {
  const support = getPushSupport();
  const message = action.isPending ? 'Đang xử lý…' : (action.error?.message ?? action.data ?? '');
  return (
    <>
      {detectIosBrowser() ? (
        <IosInstallGuide />
      ) : (
        support && (
          <p className="rounded-xl bg-[#eaf6f5] p-4 text-sm leading-relaxed text-[#183d32]">{support}</p>
        )
      )}
      {config.isError && (
        <p role="alert" className="rounded-xl bg-[#ffdad6] p-4 text-sm text-[#93000a]">
          Chưa đọc được cấu hình.{' '}
          <button className="font-semibold underline" onClick={() => void config.refetch()}>
            Thử lại
          </button>
        </p>
      )}
      <p
        role="status"
        aria-live="polite"
        className={
          message
            ? `rounded-xl p-3 text-sm ${action.isError ? 'bg-[#ffdad6] text-[#93000a]' : 'bg-[#aef0da] text-[#055141]'}`
            : 'sr-only'
        }
      >
        {message}
      </p>
    </>
  );
}
