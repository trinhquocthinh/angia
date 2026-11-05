import type { AiBillingView } from '@angia/contracts';
import { formatBillingUsd } from '../application/formatBillingUsd';

const labels = {
  unverified: 'Chưa đối chiếu',
  complete: 'Đã đối chiếu',
  gap: 'Thiếu bản ghi phí',
  error: 'Lỗi đồng bộ',
  counter_reset: 'Bộ đếm đã thay đổi',
  credential_changed: 'Khóa nguồn đã thay đổi',
  receipt_conflict: 'Bản ghi phí xung đột',
  missing_credential: 'Thiếu khóa nguồn phí',
};
export function AiBillingSourceList({ sources }: { sources: AiBillingView['sources'] }) {
  return sources.length ? (
    <ul className="m-0 grid gap-2 p-0 list-none" aria-label="Nguồn phí đã cấu hình">
      {sources.map((source) => (
        <li key={source.id} className="grid min-w-0 gap-0.5 rounded-xl bg-[#eaf6f5]/70 p-3 text-xs leading-5">
          <div className="flex flex-wrap items-center justify-between gap-x-3">
            <span className="font-semibold text-[#131d1d]">OpenRouter</span>
            <span className="break-all font-semibold text-[#004135] tabular-nums">
              {formatBillingUsd(source.confirmedSpendUsd)}
            </span>
          </div>
          <span className="text-[#404945]">{labels[source.status]}</span>
          {/* TC-548: mã nguồn để đối chiếu khi có nhiều khóa; không cần đọc thường xuyên nên thu gọn. */}
          <details className="text-[11px] text-[#55615f]">
            <summary className="cursor-pointer">Mã nguồn</summary>
            <span className="break-all font-mono">{source.id}</span>
          </details>
        </li>
      ))}
    </ul>
  ) : (
    <p className="m-0 text-xs leading-5 text-[#55615f]">Chưa có nguồn phí được đăng ký.</p>
  );
}
