import type { FamilyScanQuota, FamilyUsage } from '@angia/contracts';
import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { revealStyle } from '@src/shared/ui/revealStyle';
import type { ReactNode } from 'react';
import {
  aiQueueBlockReason,
  formatAiUsage,
  formatStorageUsage,
  usageBlockReason,
} from '../../application/familyUsageState';

type Meter = { label: string; value: string; used: number; limit: number };

function UsageMeter({ label, value, used, limit }: Meter) {
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;
  const full = used >= limit;
  const [amount, cap] = value.split(' / ');
  return (
    <div className="doc-metric-tile">
      <span className="text-caption font-medium text-text-secondary">{label}</span>
      {cap ? (
        <span className="flex flex-wrap items-baseline gap-x-1.5 tabular-nums">
          <span className="auth-heading text-heading-1 font-semibold text-accent">{amount}</span>
          <span className="text-caption text-text-secondary">/ {cap}</span>
        </span>
      ) : (
        <span className="text-caption font-semibold text-text-primary">{value}</span>
      )}
      <div
        role="progressbar"
        aria-label={`${label}: ${value}`}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        className="h-2 overflow-hidden rounded-full bg-surface-container-high"
      >
        <div
          className={`upload-meter-fill h-full rounded-full ${full ? 'bg-danger' : 'bg-accent'}`}
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

function isAiExhausted(usage: FamilyUsage | null, scanQuota: FamilyScanQuota | null | undefined) {
  return Boolean(
    usage?.aiOcr?.exhausted ||
    scanQuota?.status === 'unconfigured' ||
    (scanQuota && scanQuota.remainingScans <= 0),
  );
}

function ManualEntryShortcut({ profileId }: { profileId: string }) {
  return (
    <Link
      to="/profiles/$profileId/manual"
      params={{ profileId }}
      className="inline-flex min-h-btn items-center gap-2 rounded-2xl bg-accent-soft px-4 text-button-secondary font-semibold text-accent transition-colors hover:bg-choice-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
    >
      <AdminIcon name="edit" size={18} />
      Nhập tay
    </Link>
  );
}

// SPEC-030 + E30-S2-T2: mức đã dùng / trần tài nguyên theo 3D Bento v2.0; hết lượt có lối mở "Nhập tay".
export function FamilyUsageCard({
  usage,
  scanQuota,
  manualProfileId = null,
  children,
}: {
  usage: FamilyUsage | null;
  scanQuota?: FamilyScanQuota | null;
  manualProfileId?: string | null;
  children?: ReactNode;
}) {
  const reason = usage && (usageBlockReason(usage) ?? aiQueueBlockReason(usage, 0));
  return (
    <section
      aria-labelledby="family-usage-title"
      className="doc-bento-card angia-modal-reveal flex flex-col gap-4 p-5 sm:p-6"
      style={revealStyle(2)}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span className="doc-clay-tile" aria-hidden="true">
            <ProfileSectionIcon name="folder_open" size={30} />
          </span>
          <h2 id="family-usage-title" className="auth-heading text-heading-2 font-semibold text-accent">
            Mức sử dụng của gia đình
          </h2>
        </div>
        {isAiExhausted(usage, scanQuota) && manualProfileId && (
          <ManualEntryShortcut profileId={manualProfileId} />
        )}
      </div>
      {usage && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {usageMeters(usage, scanQuota).map((meter) => (
            <UsageMeter key={meter.label} {...meter} />
          ))}
        </div>
      )}
      {children && (
        <div className="border-t border-border/50 pt-3 text-caption text-text-secondary">{children}</div>
      )}
      {reason && (
        <p role="status" className="rounded-2xl bg-danger-soft/75 p-3.5 text-body font-medium text-danger">
          {reason}
        </p>
      )}
    </section>
  );
}
