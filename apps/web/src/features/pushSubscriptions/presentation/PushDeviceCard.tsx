import type { PushStateView } from '../application/describePushState';
import { PushIcon } from './PushIcon';
import { PushStatePill } from './PushStatePill';
import { PushToggle } from './PushToggle';

// Thẻ chính bản di động: công tắc phản ánh đăng ký thật; bật/tắt gọi cùng thao tác với các nút bên dưới.
export function PushDeviceCard({
  state,
  registered,
  canToggle,
  onToggle,
}: {
  state: PushStateView;
  registered: boolean;
  canToggle: boolean;
  onToggle(): void;
}) {
  return (
    <section className="rounded-[20px] bg-surface p-5 shadow-[0_1px_2px_color-mix(in_srgb,var(--color-shadow)_6%,transparent)] lg:hidden">
      <div className="flex items-start gap-4">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
          <PushIcon name={registered ? 'ring' : 'bellOff'} size={28} />
          <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-accent text-on-accent">
            <PushIcon name="shield" size={12} />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-['Newsreader',Georgia,serif] text-2xl leading-tight font-semibold text-text-primary">
              Thông báo trên thiết bị này
            </h1>
            <PushToggle checked={registered} disabled={!canToggle} onToggle={onToggle} />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-text-secondary">
            Bật nhận thông báo từ AN GIA. Màn hình khóa chỉ hiện{' '}
            <strong className="font-semibold text-text-primary">“Đến giờ dùng thuốc”</strong>. Chi tiết được
            xem sau khi đăng nhập và kiểm tra quyền.
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3.5">
        <span className="flex min-w-0 items-center gap-2 text-sm text-text-primary">
          <span className="text-accent">
            <PushIcon name="shield" />
          </span>
          {state.tone === 'active' ? 'Bảo mật bệnh án gia đình' : state.detail}
        </span>
        <PushStatePill state={state} />
      </div>
    </section>
  );
}
