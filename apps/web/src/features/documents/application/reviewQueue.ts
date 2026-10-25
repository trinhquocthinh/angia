import type { SourceDocument } from './reviewPorts';

const VIETNAM = 'Asia/Ho_Chi_Minh';
const dayKey = (date: Date) =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: VIETNAM,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
const dayLabel = (key: string) => key.split('-').reverse().join('/');

export interface QueueGroup {
  label: string;
  documents: SourceDocument[];
}

// Nhóm theo ngày tải lên (giờ Việt Nam) giữ nguyên thứ tự API (mới nhất trước).
export function groupQueueByDay(documents: SourceDocument[], now: Date): QueueGroup[] {
  const today = dayKey(now);
  const yesterday = dayKey(new Date(now.getTime() - 24 * 60 * 60 * 1000));
  const groups = new Map<string, SourceDocument[]>();
  for (const document of documents) {
    const key = dayKey(new Date(document.createdAt));
    groups.set(key, [...(groups.get(key) ?? []), document]);
  }
  return [...groups].map(([key, items]) => {
    const prefix = key === today ? 'Hôm nay · ' : key === yesterday ? 'Hôm qua · ' : '';
    return { label: `${prefix}${dayLabel(key)}`, documents: items };
  });
}

// Duyệt xong chuyển sang chứng từ kế tiếp trong hàng đợi; không còn chứng từ khác thì null.
export function nextDocumentId(queue: SourceDocument[], currentId: string): string | null {
  const others = queue.filter((document) => document.id !== currentId);
  if (others.length === 0) return null;
  const index = queue.findIndex((document) => document.id === currentId);
  return (index === -1 ? others[0] : (queue.slice(index + 1)[0] ?? others[0]))!.id;
}
