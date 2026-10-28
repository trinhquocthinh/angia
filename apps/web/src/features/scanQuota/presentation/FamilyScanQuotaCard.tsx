import type { FamilyScanQuota } from '@angia/contracts';
export function FamilyScanQuotaCard({
  quota,
  loading,
  error,
  onRetry,
}: {
  quota: FamilyScanQuota | null;
  loading: boolean;
  error: boolean;
  onRetry(): void;
}) {
  return (
    <section
      aria-labelledby="family-scan-quota-title"
      aria-busy={loading}
      className="flex flex-col gap-3 rounded-xl bg-[#eaf6f5]/70 p-4 shadow-sm"
    >
      <h2 id="family-scan-quota-title" className="auth-heading text-base font-semibold text-[#004135]">
        Lượt nhận diện của gia đình
      </h2>
      {loading ? (
        <p role="status">Đang tải hạn mức lượt…</p>
      ) : error ? (
        <div role="alert">
          <p>Không thể tải hạn mức lượt.</p>
          <button
            type="button"
            className="admin-button min-h-10 w-full rounded-xl border-0 bg-[#286958] px-4 py-2 text-[12px] font-semibold text-white shadow-sm transition-colors hover:bg-[#004135] disabled:cursor-wait disabled:opacity-60"
            onClick={onRetry}
          >
            Thử lại
          </button>
        </div>
      ) : !quota ? (
        <p>Chưa xác định hạn mức lượt.</p>
      ) : quota.status === 'unconfigured' ? (
        <p>Tháng {quota.month} · Chưa cấp lượt tháng này.</p>
      ) : (
        <div className="grid gap-1 text-sm text-[#404945]">
          <p>
            Tháng {quota.month} ·{' '}
            {quota.status === 'default'
              ? 'Lượt mặc định'
              : quota.status === 'trial'
                ? 'Lượt dùng thử'
                : 'Đã duyệt'}
          </p>
          <p>
            Đã dùng {quota.usedScans} / {quota.grantedScans} lượt
          </p>
          <p>Đang giữ {quota.heldScans} lượt</p>
          <p>Còn lại {quota.remainingScans} lượt</p>
        </div>
      )}
    </section>
  );
}
