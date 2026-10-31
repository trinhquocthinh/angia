import type { TimelineEvent } from '@angia/contracts';
import { Link } from '@tanstack/react-router';
import { formatNumber, readingText } from '@src/features/measurements/application/formatMeasurement';
import { TimelinePrescription } from './TimelinePrescription';
import { TimelineLabResults } from './TimelineLabResults';

export function TimelineEventDetails({ event, profileId }: { event: TimelineEvent; profileId: string }) {
  switch (event.kind) {
    case 'prescription':
      return <TimelinePrescription data={event.data} profileId={profileId} />;
    case 'lab_result':
      return <TimelineLabResults data={event.data} />;
    case 'measurement':
      return (
        <>
          <p>
            {event.data.kind === 'blood_pressure' ? 'Huyết áp' : 'Đường huyết'}: {readingText(event.data)}
          </p>
          {event.data.pulse !== null && <p>Mạch: {formatNumber(event.data.pulse)} lần/phút</p>}
        </>
      );
    case 'course_stopped':
      return <p>{event.data.name}</p>;
    case 'adherence_period':
      return (
        <p>
          {event.data.medicationName} · {event.data.status === 'taking' ? 'Đang dùng' : 'Đã dừng'}
        </p>
      );
    case 'revisit':
      return (
        <>
          <p>Lịch hẹn từ {event.data.prescriptionIds.length} đơn thuốc</p>
          <ul className="flex flex-col items-start gap-1">
            {event.data.prescriptionIds.map((prescriptionId, index) => (
              <li key={prescriptionId}>
                <Link
                  to="/profiles/$profileId/prescriptions/$prescriptionId"
                  params={{ profileId, prescriptionId }}
                  className="inline-flex min-h-11 items-center font-semibold text-[#004135] underline underline-offset-4"
                >
                  Xem đơn thuốc {index + 1}
                </Link>
              </li>
            ))}
          </ul>
        </>
      );
  }
}
