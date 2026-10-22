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
    <section className="rounded-[20px] bg-white p-5 shadow-[0_1px_2px_#1f2a2a0f] lg:hidden">
      <div className="flex items-start gap-4">
        <span className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#eaf6f5] text-[#004135]">
          <PushIcon name={registered ? 'ring' : 'bellOff'} size={28} />
          <span className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#004135] text-white">
            <PushIcon name="shield" size={12} />
          </span>
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h1 className="font-['Newsreader',Georgia,serif] text-2xl leading-tight font-semibold text-[#131d1d]">
              Thông báo trên thiết bị này
            </h1>
            <PushToggle checked={registered} disabled={!canToggle} onToggle={onToggle} />
          </div>
          <p className="mt-1 text-sm leading-relaxed text-[#404945]">
            Bật nhận thông báo từ AN GIA. Màn hình khóa chỉ hiện{' '}
            <strong className="font-semibold text-[#131d1d]">“Đến giờ dùng thuốc”</strong>. Chi tiết được xem
            sau khi đăng nhập và kiểm tra quyền.
          </p>
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[#e4f0ef] pt-3.5">
        <span className="flex min-w-0 items-center gap-2 text-sm text-[#131d1d]">
          <span className="text-[#286958]">
            <PushIcon name="shield" />
          </span>
          {state.tone === 'active' ? 'Bảo mật bệnh án gia đình' : state.detail}
        </span>
        <PushStatePill state={state} />
      </div>
    </section>
  );
}
