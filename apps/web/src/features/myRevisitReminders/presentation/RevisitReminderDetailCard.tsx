import type { MyRevisitReminder } from '@angia/contracts';
import { Link } from '@tanstack/react-router';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { RevisitPrescriptionList } from './RevisitPrescriptionList';

export function RevisitReminderDetailCard({ reminder }: { reminder: MyRevisitReminder }) {
  return (
    <section aria-labelledby="revisit-profile" className="reminder-card flex flex-col gap-6 p-5 md:p-7">
      <div className="flex min-w-0 items-center gap-3.5">
        <span className="reminder-ceramic-avatar" aria-hidden="true">
          {reminder.profileName.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <p className="text-caption font-semibold text-text-secondary">Lịch hẹn của</p>
          <h2 id="revisit-profile" className="auth-heading break-words text-heading-2 font-semibold">
            {reminder.profileName}
          </h2>
        </div>
      </div>
      <div className="reminder-schedule-strip">
        <div className="flex min-w-0 items-center gap-3">
          <span className="reminder-section-tile" aria-hidden="true">
            <ProfileSectionIcon name="event" size={30} />
          </span>
          <div className="min-w-0">
            <p className="text-caption font-semibold text-text-secondary">Ngày hẹn tái khám</p>
            <p className="auth-heading text-heading-2 font-semibold text-accent tabular-nums">
              <strong>{formatDay(reminder.revisitDate)}</strong>
            </p>
          </div>
        </div>
        {reminder.prescriptions.length > 0 && (
          <span className="reminder-pill tabular-nums">{reminder.prescriptions.length} đơn thuốc</span>
        )}
      </div>
      <RevisitPrescriptionList prescriptions={reminder.prescriptions} />
      {reminder.canOpenSummary && (
        <Link
          to="/profiles/$profileId/summary"
          params={{ profileId: reminder.profileId }}
          className="reminder-primary-cta"
        >
          <AdminIcon name="menu_book" size={20} />
          <span>Tóm tắt đi khám</span>
          <AdminIcon name="arrow_forward" size={18} />
        </Link>
      )}
    </section>
  );
}
