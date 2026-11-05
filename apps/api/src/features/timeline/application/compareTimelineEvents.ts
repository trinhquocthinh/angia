import type { TimelineCursor } from '@angia/contracts';

// So sánh mã ký tự như COLLATE "C" trong PostgreSQL; không dùng localeCompare.
export function compareTimelineEvents(a: TimelineCursor, b: TimelineCursor): number {
  const compare = (x: string, y: string) => (x < y ? -1 : x > y ? 1 : 0);
  return (
    compare(b.date, a.date) ||
    compare(b.time ?? '', a.time ?? '') ||
    compare(a.kind, b.kind) ||
    compare(a.id, b.id)
  );
}
