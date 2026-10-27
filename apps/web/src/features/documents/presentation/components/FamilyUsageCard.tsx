import type { FamilyScanQuota, FamilyUsage } from '@angia/contracts';
import { formatAiUsage, formatStorageUsage, usageBlockReason } from '../../application/familyUsageState';

function UsageBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;
  const full = used >= limit;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-[13px] leading-5 text-[#404945]">{label}</span>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        className="h-2 overflow-hidden rounded-full bg-[#deebea]"
      >
        <div
          className={`h-full rounded-full ${full ? 'bg-[#93000a]' : 'bg-[#286958]'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// Có hạn mức lượt thì hiện số lượt (đã dùng gồm đang giữ / được cấp); chưa tải được thì giữ phần trăm.
function aiOcrBar(usage: FamilyUsage, quota: FamilyScanQuota | null | undefined) {
  const prefix = 'Đọc chữ tự động tháng này:';
  if (!quota)
    return {
      label: `${prefix} đã dùng ${formatAiUsage(usage.aiOcr)}`,
      used: usage.aiOcr.usedPercent,
      limit: 100,
    };
  if (quota.status === 'unconfigured') return { label: `${prefix} chưa được cấp lượt`, used: 0, limit: 0 };
  const used = quota.usedScans + quota.heldScans;
  return { label: `${prefix} ${used} / ${quota.grantedScans} lượt`, used, limit: quota.grantedScans };
}

// SPEC-030: mức đã dùng / trần tài nguyên của gia đình, hiện trên trang tải ảnh.
export function FamilyUsageCard({
  usage,
  scanQuota,
}: {
  usage: FamilyUsage;
  scanQuota?: FamilyScanQuota | null;
}) {
  const reason = usageBlockReason(usage);
  const { storage, dailyUploads, pendingJobs } = usage;
  return (
    <section
      aria-labelledby="family-usage-title"
      className="flex flex-col gap-3 rounded-xl bg-[#eaf6f5]/70 p-4 shadow-sm"
    >
      <h2 id="family-usage-title" className="auth-heading text-base font-semibold text-[#004135]">
        Mức sử dụng của gia đình
      </h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <UsageBar
          label={formatStorageUsage(storage.usedBytes, storage.limitBytes)}
          used={storage.usedBytes}
          limit={storage.limitBytes}
        />
        <UsageBar
          label={`${dailyUploads.used} / ${dailyUploads.limit} ảnh hôm nay`}
          used={dailyUploads.used}
          limit={dailyUploads.limit}
        />
        <UsageBar
          label={`${pendingJobs.used} / ${pendingJobs.limit} ảnh đang xử lý`}
          used={pendingJobs.used}
          limit={pendingJobs.limit}
        />
        <UsageBar {...aiOcrBar(usage, scanQuota)} />
      </div>
      {reason && (
        <p role="status" className="rounded-xl bg-[#ffdad6]/60 p-3 text-sm text-[#93000a]">
          {reason}
        </p>
      )}
    </section>
  );
}
