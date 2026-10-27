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
    <ul className="m-0 grid gap-3 p-0 list-none" aria-label="Nguồn phí đã cấu hình">
      {sources.map((source) => (
        <li
          key={source.id}
          className="grid min-w-0 gap-1 border-t border-[#e4e9e5] pt-3 text-[12px] leading-5"
        >
          <div className="flex flex-wrap justify-between gap-x-3">
            <span className="font-semibold text-[#131d1d]">
              {source.provider === 'woku' ? 'Woku' : 'OpenRouter'}
            </span>
            <span className="break-all text-[#55615f]">{formatBillingUsd(source.confirmedSpendUsd)}</span>
          </div>
          <span className="break-all text-[11px] text-[#707975]">Mã nguồn: {source.id}</span>
          <span className="text-[#707975]">{labels[source.status]}</span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="m-0 text-[12px] leading-5 text-[#707975]">Chưa có nguồn phí được đăng ký.</p>
  );
}
