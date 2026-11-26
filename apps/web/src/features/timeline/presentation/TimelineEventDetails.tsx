import type { TimelineEvent } from '@angia/contracts';
import { Link } from '@tanstack/react-router';
import { formatNumber, readingText } from '@src/features/measurements/application/formatMeasurement';
import { TimelinePrescription } from './TimelinePrescription';
import { TimelineLabResults } from './TimelineLabResults';
import { TimelineAsNeededDose } from './TimelineAsNeededDose';
import { TimelinePainEvent } from './TimelinePainEvent';

type Props = { event: TimelineEvent; profileId: string | undefined };

function TimelineRevisitDetails({
  prescriptionIds,
  profileId,
}: {
  prescriptionIds: string[];
  profileId: string | undefined;
}) {
  return (
    <>
      <p className="text-body font-medium text-text-primary tabular-nums">
        Lịch hẹn từ {prescriptionIds.length} đơn thuốc
      </p>
      {profileId && (
        <ul className="flex flex-wrap items-center gap-2 pt-1">
          {prescriptionIds.map((prescriptionId, index) => (
            <li key={prescriptionId}>
              <Link
                to="/profiles/$profileId/prescriptions/$prescriptionId"
                params={{ profileId, prescriptionId }}
                className="inline-flex min-h-11 items-center rounded-xl border border-border/45 bg-bg px-3.5 text-caption font-semibold text-accent transition-colors hover:bg-accent-soft"
              >
                Xem đơn thuốc {index + 1}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function TimelineEventDetails({ event, profileId }: Props) {
  switch (event.kind) {
    case 'prescription':
      return <TimelinePrescription data={event.data} profileId={profileId} />;
    case 'lab_result':
      return <TimelineLabResults data={event.data} />;
    case 'measurement':
      return (
        <>
          <p className="text-body font-semibold text-text-primary tabular-nums">
            {event.data.kind === 'blood_pressure' ? 'Huyết áp' : 'Đường huyết'}: {readingText(event.data)}
          </p>
          {event.data.pulse !== null && (
            <p className="text-text-secondary tabular-nums">
              Mạch: {formatNumber(event.data.pulse)} lần/phút
            </p>
          )}
        </>
      );
    case 'course_stopped':
      return <p className="text-body font-medium text-text-primary">{event.data.name}</p>;
    case 'temperature':
      return (
        <p className="text-body font-semibold text-text-primary tabular-nums">
          {formatNumber(event.data.celsius)} °C
        </p>
      );
    case 'as_needed_dose':
      return <TimelineAsNeededDose data={event.data} />;
    case 'pain_entry':
    case 'pain_issue_status':
    case 'exercise_started':
      return <TimelinePainEvent event={event} />;
    case 'adherence_period':
      return (
        <p className="text-body font-medium text-text-primary">
          {event.data.medicationName} · {event.data.status === 'taking' ? 'Đang dùng' : 'Đã dừng'}
        </p>
      );
    case 'revisit':
      return <TimelineRevisitDetails prescriptionIds={event.data.prescriptionIds} profileId={profileId} />;
  }
}
