import type { FamilyScanQuota, FamilyUsage } from '@angia/contracts';
import { revealStyle } from '@src/shared/ui/revealStyle';
import type { ReactNode } from 'react';
import {
  aiQueueBlockReason,
  formatAiUsage,
  formatStorageUsage,
  usageBlockReason,
} from '../../application/familyUsageState';
import { DocumentIcon } from './DocumentIcon';

type Meter = { label: string; value: string; used: number; limit: number };

function UsageMeter({ label, value, used, limit }: Meter) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;
  const full = used >= limit;
  const near = !full && percent >= 80;
  const [amount, cap] = value.split(' / ');
  return (
    <div className="flex min-w-0 flex-col justify-end gap-1.5">
      <span className="text-xs leading-4 font-medium text-[#404945]">{label}</span>
      {cap ? (
        <span className="flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
          <span className="auth-heading text-[22px] leading-8 font-semibold text-[#131d1d]">{amount}</span>
          <span className="text-xs leading-4 text-[#55615f]">/ {cap}</span>
        </span>
      ) : (
        <span className="text-sm leading-8 font-semibold text-[#131d1d]">{value}</span>
      )}
      <div
        role="progressbar"
        aria-label={`${label}: ${value}`}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        className="h-1.5 overflow-hidden rounded-full bg-[#e4f0f0]"
      >
        <div
          className={`upload-meter-fill h-full rounded-full ${full ? 'bg-[#93000a]' : near ? 'bg-[#833b00]' : 'bg-[#286958]'}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// Có hạn mức lượt thì hiện số lượt (đã dùng gồm đang giữ / được cấp); chưa tải được thì giữ phần trăm.
function aiOcrMeter(usage: FamilyUsage, quota: FamilyScanQuota | null | undefined): Meter {
  const label = 'Nhận diện tháng này';
  if (!quota)
    return {
      label,
      value: `đã dùng ${formatAiUsage(usage.aiOcr)}`,
      used: usage.aiOcr.usedPercent,
      limit: 100,
    };
  if (quota.status === 'unconfigured') return { label, value: 'chưa được cấp lượt', used: 0, limit: 0 };
  const used = quota.usedScans + quota.heldScans;
  return { label, value: `${used} / ${quota.grantedScans} lượt`, used, limit: quota.grantedScans };
}

function usageMeters(usage: FamilyUsage, quota: FamilyScanQuota | null | undefined): Meter[] {
  const { storage, dailyUploads, pendingJobs } = usage;
  return [
    {
      label: 'Dung lượng',
      value: formatStorageUsage(storage.usedBytes, storage.limitBytes),
      used: storage.usedBytes,
      limit: storage.limitBytes,
    },
    {
      label: 'Ảnh hôm nay',
      value: `${dailyUploads.used} / ${dailyUploads.limit}`,
      used: dailyUploads.used,
      limit: dailyUploads.limit,
    },
    {
      label: 'Đang xử lý',
      value: `${pendingJobs.used} / ${pendingJobs.limit}`,
      used: pendingJobs.used,
      limit: pendingJobs.limit,
    },
    aiOcrMeter(usage, quota),
  ];
}

// SPEC-030: mức đã dùng / trần tài nguyên của gia đình, hiện trên trang tải ảnh; children là dòng thông tin lượt.
export function FamilyUsageCard({
  usage,
  scanQuota,
  children,
}: {
  usage: FamilyUsage | null;
  scanQuota?: FamilyScanQuota | null;
  children?: ReactNode;
}) {
  const reason = usage && (usageBlockReason(usage) ?? aiQueueBlockReason(usage, 0));
  return (
    <section
      aria-labelledby="family-usage-title"
      className="angia-modal-reveal flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-card max-md:p-4"
      style={revealStyle(6)}
    >
      <h2
        id="family-usage-title"
        className="flex items-center gap-1.5 text-lg leading-6 font-semibold text-[#131d1d]"
      >
        <span className="text-[#286958]">
          <DocumentIcon name="cloud" />
        </span>
        Mức sử dụng của gia đình
      </h2>
      {usage && (
        <div className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
          {usageMeters(usage, scanQuota).map((meter) => (
            <UsageMeter key={meter.label} {...meter} />
          ))}
        </div>
      )}
      {children && (
        <div className="border-t border-[#e4f0f0] pt-3 text-[13px] leading-5 text-[#55615f]">{children}</div>
      )}
      {reason && (
        <p role="status" className="rounded-xl bg-[#ffdad6]/60 p-3 text-sm text-[#93000a]">
          {reason}
        </p>
      )}
    </section>
  );
}
