import { describe, expect, it } from 'vitest';
import { groupQueueByDay, nextDocumentId } from './reviewQueue';
import type { SourceDocument } from './reviewPorts';

const doc = (id: string, createdAt: string): SourceDocument => ({
  id,
  healthProfileId: 'p',
  batchId: 'b',
  type: 'device_reading',
  status: 'pending_review',
  documentDate: null,
  mimeType: 'image/jpeg',
  sizeBytes: 1,
  createdAt,
});

describe('Hàng đợi chờ duyệt', () => {
  it('nhóm theo ngày tải lên giờ Việt Nam, nhãn Hôm nay / Hôm qua', () => {
    const now = new Date('2026-10-05T03:00:00Z');
    const groups = groupQueueByDay(
      [doc('a', '2026-10-04T18:30:00Z'), doc('b', '2026-10-04T10:00:00Z'), doc('c', '2026-10-01T10:00:00Z')],
      now,
    );
    expect(groups.map((g) => [g.label, g.documents.map((d) => d.id)])).toEqual([
      ['Hôm nay · 05/10/2026', ['a']],
      ['Hôm qua · 04/10/2026', ['b']],
      ['01/10/2026', ['c']],
    ]);
  });

  it('chứng từ kế tiếp sau chứng từ vừa duyệt; hết thì về đầu; chỉ còn nó thì null', () => {
    const queue = [doc('a', ''), doc('b', ''), doc('c', '')];
    expect(nextDocumentId(queue, 'b')).toBe('c');
    expect(nextDocumentId(queue, 'c')).toBe('a');
    expect(nextDocumentId([doc('a', '')], 'a')).toBeNull();
    expect(nextDocumentId(queue, 'x')).toBe('a');
  });
});
