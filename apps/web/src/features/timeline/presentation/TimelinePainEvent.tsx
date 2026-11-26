import type { TimelineEvent } from '@angia/contracts';
import { describeBodyLocation } from '@src/features/painJournal/presentation/BodyMap2D/describeBodyLocation';

type PainKind = 'pain_entry' | 'pain_issue_status' | 'exercise_started';
type Props = { event: Extract<TimelineEvent, { kind: PainKind }> };

// BR-033: chỉ nêu dữ liệu đã ghi, không diễn giải mức đau hay thay đổi.
export function TimelinePainEvent({ event }: Props) {
  const location = (
    <p className="text-body font-semibold text-text-primary">{describeBodyLocation(event.data)}</p>
  );
  switch (event.kind) {
    case 'pain_entry':
      return (
        <>
          {location}
          <p className="inline-flex rounded-xl border border-border/35 bg-bg px-2.5 py-0.5 text-caption font-semibold text-text-primary tabular-nums">
            Mức {event.data.level}/10
          </p>
          {event.data.note && <p className="whitespace-pre-wrap text-text-secondary">{event.data.note}</p>}
        </>
      );
    case 'pain_issue_status':
      return (
        <>
          {location}
          <p className="text-text-secondary">
            {event.data.change === 'resolved' ? 'Đánh dấu đã khỏi' : 'Mở lại'}
          </p>
        </>
      );
    case 'exercise_started':
      return (
        <>
          <p className="text-body font-semibold text-text-primary">{event.data.name}</p>
          {location}
          <p className="text-text-secondary">{event.data.source === 'self' ? 'Tự ghi' : 'Bác sĩ chỉ định'}</p>
        </>
      );
  }
}
