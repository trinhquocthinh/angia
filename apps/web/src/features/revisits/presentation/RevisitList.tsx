import type { RevisitList as RevisitGroups } from '@angia/contracts';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import type { RevisitPrescription } from '../application/ports';

type Props = {
  data: RevisitGroups;
  /** Không truyền: chỉ đọc (tự xem, SPEC-042). */
  onEdit?: (prescription: RevisitPrescription, revisitDate: string) => void;
};

export function RevisitList({ data, onEdit }: Props) {
  if (!data.length)
    return (
      <div className="profile-bento-card flex flex-col items-center gap-3 px-6 py-10 text-center">
        <ProfileSectionIcon name="event" size={52} />
        <p className="text-body text-text-secondary">Chưa có lịch tái khám từ hôm nay.</p>
      </div>
    );
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {data.map((group) => (
        <section key={group.revisitDate} className="profile-bento-card flex flex-col gap-3.5 p-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <ProfileSectionIcon name="event" size={36} />
              <h2 className="text-heading-2 font-semibold text-accent tabular-nums">
                {formatDay(group.revisitDate)}
              </h2>
            </div>
            <span className="rounded-full bg-accent-soft px-2.5 py-0.5 text-caption font-semibold text-accent tabular-nums">
              {group.prescriptions.length} đơn
            </span>
          </div>
          <ul className="flex flex-col gap-2.5">
            {group.prescriptions.map((prescription) => (
              <li
                key={prescription.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-bg p-3.5"
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <ProfileSectionIcon name="receipt_long" size={28} />
                  <div className="min-w-0 text-caption">
                    <p className="font-semibold break-words text-text-primary">
                      {prescription.facility || 'Đơn không ghi nơi khám'}
                    </p>
                    <p className="text-text-secondary tabular-nums">
                      Đơn ngày {formatDay(prescription.issuedDate)}
                    </p>
                  </div>
                </div>
                {onEdit && (
                  <button
                    id={`revisit-edit-${prescription.id}`}
                    type="button"
                    onClick={() => onEdit(prescription, group.revisitDate)}
                    className="inline-flex min-h-btn cursor-pointer items-center gap-1.5 rounded-2xl border border-border bg-surface px-4 text-button-secondary font-semibold text-accent transition-colors hover:bg-accent-soft"
                  >
                    <AdminIcon name="edit" size={16} />
                    Sửa ngày hẹn
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
