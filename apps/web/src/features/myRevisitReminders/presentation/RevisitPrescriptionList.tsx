import type { MyRevisitReminder } from '@angia/contracts';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';

export function RevisitPrescriptionList({
  prescriptions,
}: {
  prescriptions: MyRevisitReminder['prescriptions'];
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-caption font-semibold text-accent">Đơn thuốc có ngày hẹn này</h3>
      {prescriptions.length > 0 ? (
        <ul className="flex flex-col gap-2.5">
          {prescriptions.map((prescription) => (
            <li key={prescription.id} className="reminder-item-tile items-start">
              <span className="reminder-section-tile" aria-hidden="true">
                <ProfileSectionIcon name="receipt_long" size={30} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-body font-semibold text-text-primary tabular-nums">
                  Đơn ngày {formatDay(prescription.issuedDate)}
                </p>
                <p className="mt-0.5 flex items-center gap-1.5 text-caption break-words text-text-secondary">
                  <AdminIcon name="home_health" size={16} />
                  <span>{prescription.facility || 'Đơn không ghi nơi khám'}</span>
                </p>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="reminder-callout text-caption">
          <AdminIcon name="info" size={18} />
          <p>Không còn đơn thuốc gắn ngày hẹn này.</p>
        </div>
      )}
    </div>
  );
}
