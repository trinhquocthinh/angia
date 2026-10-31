import type { AiBillingView } from '@angia/contracts';
import { describeAiBilling } from '../application/describeAiBilling';
import { AiBillingSourceList } from './AiBillingSourceList';

const formatTime = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
});
export function AiBillingContent({ view, now }: { view: AiBillingView; now: Date }) {
  const summary = describeAiBilling(view, now);
  return (
    <div className="grid min-w-0 gap-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#55615f]">
        <span>Tháng {view.month}</span>
        <span
          role="status"
          className={`rounded-full px-2.5 py-1 font-medium ${
            summary.actualAmount ? 'bg-[#aef0da]/60 text-[#004135]' : 'bg-[#ffdbc9]/60 text-[#753400]'
          }`}
        >
          {summary.label}
        </span>
      </div>
      <p
        className={
          summary.actualAmount
            ? 'auth-heading m-0 break-all text-[28px] leading-9 font-semibold text-[#004135] tabular-nums'
            : 'm-0 text-[15px] leading-6 font-semibold text-[#004135]'
        }
      >
        {summary.actualAmount ?? 'Chưa xác nhận tổng tháng'}
      </p>
      <p className="m-0 break-all text-xs leading-5 text-[#404945]">
        Đã ghi nhận từ nguồn phí: {summary.confirmedAmount}
        <br />
        {view.lastSyncedAt
          ? `Đối chiếu gần nhất: ${formatTime.format(new Date(view.lastSyncedAt))}`
          : 'Chưa có lần đối chiếu đầy đủ.'}
      </p>
      <AiBillingSourceList sources={view.sources} />
      <p className="m-0 rounded-xl bg-[#eaf6f5] px-3 py-2 text-xs leading-5 text-[#404945]">
        Khi thiếu hoặc cũ dữ liệu phí, hay phí thực đã đạt trần tháng, nhận diện ảnh tạm dừng. Gia đình vẫn
        nhập tay được.
      </p>
    </div>
  );
}
