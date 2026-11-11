import type { MyRevisitReminder } from '@angia/contracts';
import { Link } from '@tanstack/react-router';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';

export function RevisitReminderDetailCard({ reminder }: { reminder: MyRevisitReminder }) {
  return (
    <section
      aria-labelledby="revisit-profile"
      className="flex flex-col gap-4 rounded-[20px] bg-surface p-5 lg:p-6"
    >
      <div>
        <p className="text-xs font-semibold uppercase text-accent">Hồ sơ</p>
        <h2 id="revisit-profile" className="mt-1 break-words text-lg font-semibold">
          {reminder.profileName}
        </h2>
        <p className="mt-2 text-base text-text-secondary">
          Ngày hẹn tái khám: <strong>{formatDay(reminder.revisitDate)}</strong>
        </p>
      </div>
      <div>
        <h3 className="text-sm font-semibold text-accent">Đơn thuốc có ngày hẹn này</h3>
        <ul className="mt-3 flex flex-col gap-3">
          {reminder.prescriptions.map((prescription) => (
            <li key={prescription.id} className="rounded-xl bg-accent-soft p-4 text-sm">
              <p className="font-semibold">Đơn ngày {formatDay(prescription.issuedDate)}</p>
              <p className="mt-1 break-words text-text-secondary">
                {prescription.facility || 'Đơn không ghi nơi khám'}
              </p>
            </li>
          ))}
        </ul>
        {!reminder.prescriptions.length && (
          <p className="mt-3 text-sm text-text-secondary">Không còn đơn thuốc gắn ngày hẹn này.</p>
        )}
      </div>
      {reminder.canOpenSummary && (
        <Link
          to="/profiles/$profileId/summary"
          params={{ profileId: reminder.profileId }}
          className="inline-flex min-h-11 items-center self-start rounded-full bg-accent px-5 text-sm font-semibold text-on-accent"
        >
          Tóm tắt đi khám
        </Link>
      )}
    </section>
  );
}
