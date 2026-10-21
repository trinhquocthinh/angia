import { Link } from '@tanstack/react-router';
import { createPushApi } from '../infrastructure/createPushApi';
import { getPushSupport } from '../infrastructure/getPushSupport';
import { enableBrowserPush } from '../infrastructure/enableBrowserPush';
import { disableBrowserPush } from '../infrastructure/disableBrowserPush';
import { usePushSettings } from '../application/usePushSettings';
import { PushActionButtons } from './PushActionButtons';
const api = createPushApi();
export function PushSettingsPanel({ csrf }: { csrf: string }) {
  const { config, action } = usePushSettings(api, csrf);
  const support = getPushSupport();
  const run = (work: () => Promise<void>, success: string) => {
    // Xin quyền ngay trong event bấm, trước các bước async của mutation trên iOS.
    const task = work();
    action.mutate({ task, success });
  };
  const data = config.data;
  return (
    <section className="mx-auto max-w-xl space-y-5 px-5 py-8 text-[#183d32]">
      <Link to="/" className="underline">
        ← Về AN GIA
      </Link>
      <h1 className="text-3xl font-semibold">Thông báo trên thiết bị này</h1>
      <p>
        Bật nhận thông báo từ AN GIA. Màn hình khóa chỉ hiện “Đến giờ dùng thuốc”. Chi tiết được xem sau khi
        đăng nhập và kiểm tra quyền.
      </p>
      {support && <p className="rounded-xl bg-[#eaf6f5] p-4">{support}</p>}
      {config.isPending && <p>Đang kiểm tra đăng ký…</p>}
      {config.isError && (
        <p role="alert">
          Chưa đọc được cấu hình.{' '}
          <button className="underline" onClick={() => void config.refetch()}>
            Thử lại
          </button>
        </p>
      )}
      {data && !data.enabled && <p>Tính năng thông báo chưa được bật trên máy chủ.</p>}
      {data?.registered && <p>Thiết bị đã bật nhận thông báo.</p>}
      <PushActionButtons
        busy={action.isPending}
        supported={!support}
        loaded={Boolean(data)}
        enabled={Boolean(data?.enabled && data.publicKey)}
        registered={Boolean(data?.registered)}
        onEnable={() =>
          run(() => enableBrowserPush(api, data!.publicKey!, csrf), 'Đã bật thông báo trên thiết bị này.')
        }
        onTest={() =>
          run(
            () => api.sendTest(csrf),
            'Dịch vụ push đã tiếp nhận tin thử. Kiểm tra thông báo trên thiết bị.',
          )
        }
        onDisable={() => run(() => disableBrowserPush(api, csrf), 'Đã tắt thông báo trên thiết bị này.')}
      />
      <p role="status" aria-live="polite">
        {action.isPending ? 'Đang xử lý…' : (action.error?.message ?? action.data ?? '')}
      </p>
      <p className="text-sm">
        Đóng ứng dụng hoặc hết phiên đăng nhập không tự tắt thông báo. Đăng xuất hoặc chọn “Tắt thông báo” sẽ
        ngừng gửi mới trên thiết bị này. Thông báo đã gửi có thể đến muộn.
      </p>
    </section>
  );
}
