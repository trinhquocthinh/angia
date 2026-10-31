import type { TimelineEvent } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { TimelineEventDetails } from './TimelineEventDetails';

const labels: Record<TimelineEvent['kind'], string> = {
  prescription: 'Đơn thuốc',
  lab_result: 'Phiếu xét nghiệm',
  measurement: 'Số đo',
  course_stopped: 'Dừng thuốc',
  adherence_period: 'Giai đoạn thực tế',
  revisit: 'Lịch tái khám',
};

export function TimelineEventCard({ event, profileId }: { event: TimelineEvent; profileId: string }) {
  return (
    <article className="min-w-0 rounded-xl border-l-4 border-[#286958] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-[#004135]">{labels[event.kind]}</h3>
        <time
          dateTime={event.time ? `${event.date}T${event.time}` : event.date}
          className="text-sm text-[#55615f] tabular-nums"
        >
          {formatDay(event.date)}
          {event.time ? ` · ${event.time}` : ''}
        </time>
      </div>
      <div className="mt-3 space-y-2 text-sm break-words text-[#131d1d]">
        <TimelineEventDetails event={event} profileId={profileId} />
      </div>
    </article>
  );
}
