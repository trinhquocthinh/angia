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
      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-[#707975]">
        <span>Tháng {view.month}</span>
        <span role="status" className="rounded-md bg-[#f0f4f1] px-2 py-1">
          {summary.label}
        </span>
      </div>
      <p className="m-0 break-all text-[20px] leading-7 font-semibold text-[#004135]">
        {summary.actualAmount ?? 'Chưa xác nhận tổng tháng'}
      </p>
      <p className="m-0 break-all text-[12px] leading-5 text-[#55615f]">
        Đã ghi nhận từ nguồn phí: {summary.confirmedAmount}
      </p>
      <p className="m-0 text-[11px] leading-5 text-[#707975]">
        {view.lastSyncedAt
          ? `Đối chiếu gần nhất: ${formatTime.format(new Date(view.lastSyncedAt))}`
          : 'Chưa có lần đối chiếu đầy đủ.'}
      </p>
      <AiBillingSourceList sources={view.sources} />
      <p className="m-0 rounded-xl bg-[#f4f7f5] px-3 py-2 text-[12px] leading-5 text-[#55615f]">
        Chưa dùng số liệu này để chặn nhận diện. Hạn mức hiện tại tiếp tục hoạt động.
      </p>
    </div>
  );
}
