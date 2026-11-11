import type { TimelineEvent } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { TimelineEventDetails } from './TimelineEventDetails';

const labels: Record<TimelineEvent['kind'], string> = {
  prescription: 'Đơn thuốc',
  lab_result: 'Phiếu xét nghiệm',
  measurement: 'Số đo',
  temperature: 'Nhiệt độ',
  as_needed_dose: 'Liều Khi cần',
  course_stopped: 'Dừng thuốc',
  adherence_period: 'Giai đoạn thực tế',
  revisit: 'Lịch tái khám',
  pain_entry: 'Lần ghi đau',
  pain_issue_status: 'Vấn đề đau',
  exercise_started: 'Bắt đầu bài tập',
};

type Props = { event: TimelineEvent; profileId: string | undefined };

export function TimelineEventCard({ event, profileId }: Props) {
  return (
    <article className="min-w-0 rounded-xl border-l-4 border-accent bg-surface p-5 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="font-semibold text-accent">{labels[event.kind]}</h3>
        <time
          dateTime={event.time ? `${event.date}T${event.time}` : event.date}
          className="text-sm text-text-secondary tabular-nums"
        >
          {formatDay(event.date)}
          {event.time ? ` · ${event.time}` : ''}
        </time>
      </div>
      <div className="mt-3 space-y-2 text-sm break-words text-text-primary">
        <TimelineEventDetails event={event} profileId={profileId} />
      </div>
    </article>
  );
}
