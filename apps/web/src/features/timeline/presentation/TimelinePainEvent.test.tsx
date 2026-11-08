import { timelineEventSchema } from '@angia/contracts';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { profileId } from '../test/fixtures.test-helper';
import { TimelineFeed } from './TimelineFeed';

vi.mock('@tanstack/react-router', () => ({ Link: () => null }));

const at = { issueId: profileId, region: 'knee', side: 'left' };
const key = { id: profileId, date: '2026-10-30', time: null };
const items = [
  { ...key, time: '00:30', kind: 'pain_entry', data: { ...at, level: 6, note: 'Sau khi leo cầu thang' } },
  { ...key, kind: 'pain_entry', data: { ...at, region: 'head', side: 'center', level: 3, note: null } },
  { ...key, kind: 'pain_issue_status', data: { ...at, change: 'resolved' } },
  { ...key, kind: 'pain_issue_status', data: { ...at, change: 'reopened' } },
  {
    ...key,
    kind: 'exercise_started',
    data: { ...at, exerciseId: profileId, name: 'Duỗi gối', source: 'prescribed' },
  },
  { ...key, kind: 'exercise_started', data: { ...at, exerciseId: profileId, name: 'Đi bộ', source: 'self' } },
].map((event) => timelineEventSchema.parse(event));
const props = {
  items,
  loading: false,
  error: null,
  fetchingMore: false,
  hasNextPage: false,
  retry: vi.fn(),
  loadMore: vi.fn(),
};

describe('TC-715 — thẻ sự kiện sổ đau nhức trên dòng thời gian', () => {
  it('hiện vùng, bên, mức, ghi chú, trạng thái và bài tập; không thêm nhận định', () => {
    for (const self of [false, true]) {
      const html = renderToStaticMarkup(<TimelineFeed {...props} profileId={self ? undefined : profileId} />);
      for (const text of [
        'Lần ghi đau',
        'Đầu gối · trái',
        'Mức 6/10',
        'Sau khi leo cầu thang',
        'Đầu</p>',
        'Mức 3/10',
        'Vấn đề đau',
        'Đánh dấu đã khỏi',
        'Mở lại',
        'Bắt đầu bài tập',
        'Duỗi gối',
        'Bác sĩ chỉ định',
        'Đi bộ',
        'Tự ghi',
        '00:30',
      ])
        expect(html).toContain(text);
      expect(html).not.toMatch(/null|undefined|tốt|xấu|bất thường|nặng|nhẹ|cải thiện/);
    }
  });
});
