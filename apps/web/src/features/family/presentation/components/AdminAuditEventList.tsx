import type { useAdminAuditEvents } from '../../application/useAdminAuditEvents';
import { AdminAuditEventRow } from './AdminAuditEventRow';
export function AdminAuditEventList({
  events,
}: {
  events: ReturnType<typeof useAdminAuditEvents>['events'];
}) {
  if (events.isError && !events.isFetchNextPageError) return null;
  const items = events.data?.pages.flatMap((page) => page.items) ?? [];
  if (!items.length)
    return events.isError ? null : (
      <p role="status" className="m-0 text-body text-text-secondary">
        Chưa có sự kiện nào khớp bộ lọc.
      </p>
    );
  return (
    <ul className="m-0 flex min-w-0 list-none flex-col gap-3 p-0">
      {items.map((event) => (
        <AdminAuditEventRow key={event.id} event={event} />
      ))}
    </ul>
  );
}
