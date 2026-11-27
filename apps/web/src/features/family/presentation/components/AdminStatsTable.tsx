import type { AdminStatsWeek } from '../../application/ports';
import { formatAdminVietnamTime } from '../../application/formatAdminVietnamTime';
export function AdminStatsTable({ weeks }: { weeks: AdminStatsWeek[] }) {
  return (
    <div
      className="min-w-0 overflow-x-auto rounded-2xl border border-border/45"
      role="region"
      aria-label="Bảng thống kê 12 tuần"
      tabIndex={0}
    >
      <table className="w-full min-w-[560px] border-collapse text-left text-caption tabular-nums">
        <caption className="p-3 text-left text-text-secondary">
          Số liệu theo tuần (thứ Hai – Chủ nhật, giờ Việt Nam)
        </caption>
        <thead className="bg-bg text-text-secondary">
          <tr>
            {['Tuần bắt đầu', 'Nhà', 'Tài khoản', 'Có xác nhận liều', 'Dùng đều ≥ 4 tuần'].map((label) => (
              <th key={label} scope="col" className="px-3 py-3 font-semibold">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.weekStart} className="border-t border-border/30 text-text-primary">
              <th scope="row" className="px-3 py-3 font-normal whitespace-nowrap">
                {formatAdminVietnamTime(week.weekStart)}
              </th>
              {[
                week.families,
                week.accounts,
                week.familiesWithDoseConfirmation,
                week.familiesActiveStreak4w,
              ].map((value, index) => (
                <td key={index} className="px-3 py-3">
                  {value.toLocaleString('vi-VN')}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
