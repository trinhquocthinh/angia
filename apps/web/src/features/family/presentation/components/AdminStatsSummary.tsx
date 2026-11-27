import type { AdminStatsWeek } from '../../application/ports';
export function AdminStatsSummary({ week }: { week: AdminStatsWeek }) {
  const metrics = [
    ['Tổng số nhà', week.families],
    ['Tài khoản hoạt động', week.accounts],
    ['Nhà có xác nhận liều tuần này', week.familiesWithDoseConfirmation],
    ['Nhà dùng đều từ 4 tuần', week.familiesActiveStreak4w],
  ] as const;
  return (
    <dl className="m-0 grid min-w-0 grid-cols-2 gap-3 sm:gap-4">
      {metrics.map(([label, value]) => (
        <div
          key={label}
          className="flex min-w-0 flex-col items-center justify-center rounded-2xl border border-border/45 bg-bg p-4 text-center sm:p-5"
        >
          <dt className="order-2 mt-1 text-body text-text-secondary">{label}</dt>
          <dd className="m-0 max-w-full break-words text-4xl text-text-primary tabular-nums">
            {value.toLocaleString('vi-VN')}
          </dd>
        </div>
      ))}
    </dl>
  );
}
