import type { PainIssueStatusEvent } from '@angia/contracts';
export function PainStatusHistory({ events }: { events: PainIssueStatusEvent[] }) {
  if (!events.length) return null;
  return (
    <section aria-label="Lịch sử trạng thái" className="space-y-3">
      <h2 className="text-xl font-semibold">Lịch sử trạng thái</h2>
      <ul className="space-y-2">
        {events.map((event, index) => (
          <li key={`${event.at}:${index}`} className="text-sm text-text-secondary">
            {`${event.kind === 'resolved' ? 'Đã khỏi' : 'Mở lại'} · ${event.on.split('-').reverse().join('/')} · Ghi bởi ${event.by?.displayName ?? 'Tài khoản đã xóa'}`}
          </li>
        ))}
      </ul>
    </section>
  );
}
