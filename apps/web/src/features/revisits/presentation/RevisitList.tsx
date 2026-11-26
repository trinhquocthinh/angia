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

function RevisitPrescriptionItem({
  prescription,
  revisitDate,
  onEdit,
}: {
  prescription: RevisitPrescription;
  revisitDate: string;
  onEdit?: Props['onEdit'];
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border/35 bg-bg p-4">
      <div className="flex min-w-0 items-center gap-3">
        <ProfileSectionIcon name="receipt_long" size={32} />
        <div className="min-w-0 text-caption">
          <p className="text-body font-semibold break-words text-text-primary">
            {prescription.facility || 'Đơn không ghi nơi khám'}
          </p>
          <p className="mt-0.5 text-text-secondary tabular-nums">
            Đơn ngày {formatDay(prescription.issuedDate)}
          </p>
        </div>
      </div>
      {onEdit && (
        <button
          id={`revisit-edit-${prescription.id}`}
          type="button"
          onClick={() => onEdit(prescription, revisitDate)}
          className="inline-flex min-h-btn cursor-pointer items-center gap-1.5 rounded-2xl border border-border/45 bg-surface px-4 text-button-secondary font-semibold text-accent shadow-2xs transition-colors hover:bg-accent-soft"
        >
          <AdminIcon name="edit" size={16} />
          Sửa ngày hẹn
        </button>
      )}
    </li>
  );
}

export function RevisitList({ data, onEdit }: Props) {
  if (!data.length)
    return (
      <div className="profile-bento-card flex flex-col items-center gap-3 border border-dashed border-border/60 px-6 py-10 text-center">
        <ProfileSectionIcon name="event" size={52} />
        <p className="text-body font-medium text-text-secondary">Chưa có lịch tái khám từ hôm nay.</p>
      </div>
    );
  return (
    <div className="grid min-w-0 gap-4 md:grid-cols-2">
      {data.map((group) => (
        <section
          key={group.revisitDate}
          className="profile-bento-card flex min-w-0 flex-col gap-4 p-5 sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <ProfileSectionIcon name="event" size={38} />
              <h2 className="auth-heading text-heading-2 font-semibold text-accent tabular-nums">
                {formatDay(group.revisitDate)}
              </h2>
            </div>
            <span className="rounded-full bg-secondary-container px-3 py-1 text-caption font-semibold text-on-secondary-container tabular-nums">
              {group.prescriptions.length} đơn
            </span>
          </div>
          <ul className="flex flex-col gap-3">
            {group.prescriptions.map((prescription) => (
              <RevisitPrescriptionItem
                key={prescription.id}
                prescription={prescription}
                revisitDate={group.revisitDate}
                onEdit={onEdit}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
