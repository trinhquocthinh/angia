import type { TimelineEvent } from '@angia/contracts';
import { describeBodyLocation } from '@src/features/painJournal/presentation/BodyMap2D/describeBodyLocation';

type PainKind = 'pain_entry' | 'pain_issue_status' | 'exercise_started';
type Props = { event: Extract<TimelineEvent, { kind: PainKind }> };

// BR-033: chỉ nêu dữ liệu đã ghi, không diễn giải mức đau hay thay đổi.
export function TimelinePainEvent({ event }: Props) {
  const location = <p>{describeBodyLocation(event.data)}</p>;
  switch (event.kind) {
    case 'pain_entry':
      return (
        <>
          {location}
          <p>Mức {event.data.level}/10</p>
          {event.data.note && <p className="whitespace-pre-wrap">{event.data.note}</p>}
        </>
      );
    case 'pain_issue_status':
      return (
        <>
          {location}
          <p>{event.data.change === 'resolved' ? 'Đánh dấu đã khỏi' : 'Mở lại'}</p>
        </>
      );
    case 'exercise_started':
      return (
        <>
          <p>{event.data.name}</p>
          {location}
          <p>{event.data.source === 'self' ? 'Tự ghi' : 'Bác sĩ chỉ định'}</p>
        </>
      );
  }
}
