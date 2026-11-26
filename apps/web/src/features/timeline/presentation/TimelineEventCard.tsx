import type { TimelineEvent } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import {
  ProfileSectionIcon,
  type ProfileSectionIconName,
} from '@src/features/profiles/presentation/components/ProfileSectionIcon';
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

const EVENT_ICONS: Record<TimelineEvent['kind'], ProfileSectionIconName> = {
  prescription: 'receipt_long',
  lab_result: 'science',
  measurement: 'monitor_heart',
  temperature: 'thermostat',
  as_needed_dose: 'medication',
  course_stopped: 'medication',
  adherence_period: 'medication',
  revisit: 'event',
  pain_entry: 'accessibility_new',
  pain_issue_status: 'accessibility_new',
  exercise_started: 'accessibility_new',
};

type Props = { event: TimelineEvent; profileId: string | undefined };

export function TimelineEventCard({ event, profileId }: Props) {
  return (
    <article className="profile-bento-card flex min-w-0 items-start gap-3.5 p-4 sm:p-5">
      <ProfileSectionIcon name={EVENT_ICONS[event.kind]} size={40} />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-body font-semibold text-accent">{labels[event.kind]}</h3>
          <time
            dateTime={event.time ? `${event.date}T${event.time}` : event.date}
            className="rounded-full border border-border/35 bg-bg px-3 py-1 text-caption font-medium text-text-secondary tabular-nums"
          >
            {formatDay(event.date)}
            {event.time ? ` · ${event.time}` : ''}
          </time>
        </div>
        <div className="mt-2.5 space-y-2 text-caption break-words text-text-primary">
          <TimelineEventDetails event={event} profileId={profileId} />
        </div>
      </div>
    </article>
  );
}
