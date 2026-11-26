import { Link } from '@tanstack/react-router';
import type { PrescriptionListItem } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';

function PrescriptionChainRow({
  entry,
  index,
  profileId,
}: {
  entry: PrescriptionListItem;
  index: number;
  profileId: string;
}) {
  return (
    <li className="profile-member-card flex min-w-0 flex-wrap items-center justify-between gap-4 p-5 break-words">
      <div className="flex min-w-0 items-start gap-3.5">
        <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft">
          <ProfileSectionIcon name="receipt_long" size={32} />
        </span>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-surface-container px-2.5 py-0.5 text-caption font-semibold text-text-secondary tabular-nums">
              #{index + 1}
            </span>
            <Link
              to="/profiles/$profileId/prescriptions/$prescriptionId"
              params={{ profileId, prescriptionId: entry.id }}
              className="auth-heading inline-flex min-h-11 items-center text-heading-3 font-semibold text-accent underline-offset-4 hover:underline"
            >
              Đơn ngày {formatDay(entry.issuedDate)}
            </Link>
          </div>
          <p className="mt-1 text-body font-medium text-text-primary">
            {entry.facility ?? 'Không ghi nơi khám'}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-caption">
            <span className="rounded-full bg-secondary-container px-3 py-0.5 font-semibold text-on-secondary-container tabular-nums">
              {entry.itemCount} dòng thuốc
            </span>
            <span className="rounded-full bg-bg px-3 py-0.5 font-medium text-text-secondary">
              {entry.origin === 'document' ? 'Từ giấy tờ' : 'Nhập tay'}
            </span>
            {entry.revisitDate && (
              <span className="rounded-full bg-accent-soft px-3 py-0.5 font-semibold text-accent tabular-nums">
                Ngày hẹn: {formatDay(entry.revisitDate)}
              </span>
            )}
          </div>
        </div>
      </div>
      <Link
        to="/profiles/$profileId/prescriptions/$prescriptionId"
        params={{ profileId, prescriptionId: entry.id }}
        className="inline-flex min-h-btn shrink-0 items-center gap-1.5 rounded-2xl bg-accent-soft px-4 text-button-secondary font-semibold text-accent transition-colors hover:bg-accent hover:text-on-accent"
      >
        <span>Xem chi tiết</span>
        <span aria-hidden="true">→</span>
      </Link>
    </li>
  );
}

export function PrescriptionChain({ data, profileId }: { data: PrescriptionListItem[]; profileId: string }) {
  if (!data.length)
    return (
      <div className="profile-bento-card flex flex-col items-center gap-3 border-dashed px-6 py-10 text-center">
        <ProfileSectionIcon name="receipt_long" size={52} />
        <p className="text-body font-semibold text-text-primary">Chưa có đơn thuốc đã lưu.</p>
      </div>
    );
  return (
    <ol aria-label="Chuỗi đơn thuốc theo thời gian" className="flex flex-col gap-3.5">
      {data.map((entry, index) => (
        <PrescriptionChainRow key={entry.id} entry={entry} index={index} profileId={profileId} />
      ))}
    </ol>
  );
}
