import { describe, expect, it } from 'vitest';
import type { TimelineCursor } from '@angia/contracts';
import { compareTimelineEvents } from './compareTimelineEvents.js';

describe('Thứ tự dòng thời gian', () => {
  it('TC-504: ngày/giờ giảm dần, null cuối ngày, kind/ID tăng dần theo mã ký tự', () => {
    const keys: TimelineCursor[] = [
      { date: '2026-10-30', time: '08:00', kind: 'measurement', id: 'b' },
      { date: '2026-10-30', time: '08:00', kind: 'measurement', id: 'a' },
      { date: '2026-10-30', time: null, kind: 'prescription', id: 'c' },
      { date: '2026-10-30', time: null, kind: 'course_stopped', id: 'd' },
      { date: '2026-10-31', time: null, kind: 'revisit', id: 'e' },
      { date: '2026-10-30', time: '09:00', kind: 'measurement', id: 'f' },
    ];
    expect([...keys].sort(compareTimelineEvents).map((x) => x.id)).toEqual(['e', 'f', 'a', 'b', 'd', 'c']);
    expect(compareTimelineEvents(keys[0]!, keys[0]!)).toBe(0);
  });
});
