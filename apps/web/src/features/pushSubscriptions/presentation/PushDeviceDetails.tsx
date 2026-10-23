import type { PushConfiguration } from '../application/ports';
import type { NotificationPermissionState } from '../infrastructure/getNotificationPermission';
import { PushIcon, type PushIconName } from './PushIcon';

const permissionText: Record<NotificationPermissionState, string> = {
  granted: 'Đã cấp quyền',
  denied: 'Đã chặn — mở cài đặt trình duyệt để cho phép',
  default: 'Chưa hỏi quyền',
  unsupported: 'Trình duyệt không hỗ trợ',
};

// Thông số thật của thiết bị: hỗ trợ Web Push, quyền hệ điều hành và trạng thái đăng ký trên máy chủ.
export function PushDeviceDetails({
  supported,
  permission,
  data,
}: {
  supported: boolean;
  permission: NotificationPermissionState;
  data: PushConfiguration | undefined;
}) {
  const rows: { icon: PushIconName; label: string; value: string; ok: boolean }[] = [
    {
      icon: 'browser',
      label: 'Trình duyệt hiện tại',
      value: supported ? 'Hỗ trợ Web Push' : 'Chưa hỗ trợ',
      ok: supported,
    },
    {
      icon: 'shield',
      label: 'Quyền thông báo hệ điều hành',
      value: permissionText[permission],
      ok: permission === 'granted',
    },
    {
      icon: 'server',
      label: 'Máy chủ thông báo',
      value: data ? (data.enabled && data.publicKey ? 'Đang bật' : 'Chưa bật') : '—',
      ok: Boolean(data?.enabled && data.publicKey),
    },
    {
      icon: 'bell',
      label: 'Đăng ký trên thiết bị này',
      value: data ? (data.registered ? 'Đã đăng ký' : 'Chưa đăng ký') : '—',
      ok: Boolean(data?.registered),
    },
  ];
  return (
    <section className="rounded-[20px] bg-white p-6 shadow-[0_1px_2px_#1f2a2a0f]">
      <h2 className="mb-2 text-base font-semibold text-[#131d1d]">Thông số thiết bị</h2>
      <dl className="divide-y divide-[#e4f0ef]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center gap-3 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#eaf6f5] text-[#404945]">
              <PushIcon name={row.icon} size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <dt className="text-sm text-[#131d1d]">{row.label}</dt>
              <dd className={`text-xs ${row.ok ? 'text-[#286958]' : 'text-[#707975]'}`}>{row.value}</dd>
            </div>
            <span
              aria-hidden="true"
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${row.ok ? 'bg-[#286958]' : 'bg-[#d9e5e4]'}`}
            />
          </div>
        ))}
      </dl>
    </section>
  );
}
