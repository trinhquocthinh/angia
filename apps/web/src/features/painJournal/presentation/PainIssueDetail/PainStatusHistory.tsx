import type { PainIssueStatusEvent } from '@angia/contracts';
export function PainStatusHistory({ events }: { events: PainIssueStatusEvent[] }) {
  if (!events.length) return null;
  return (
    <section aria-label="Lịch sử trạng thái" className="profile-bento-card space-y-3 p-5 sm:p-6">
      <h2 className="auth-heading text-heading-2 font-semibold text-accent">Lịch sử trạng thái</h2>
      <ul className="space-y-2">
        {events.map((event, index) => (
          <li
            key={`${event.at}:${index}`}
            className="rounded-2xl border border-border/30 bg-bg px-4 py-3 text-caption text-text-secondary tabular-nums"
          >
            {`${event.kind === 'resolved' ? 'Đã khỏi' : 'Mở lại'} · ${event.on.split('-').reverse().join('/')} · Ghi bởi ${event.by?.displayName ?? 'Tài khoản đã xóa'}`}
          </li>
        ))}
      </ul>
    </section>
  );
}
