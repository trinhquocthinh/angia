import type { useAdminAuditEvents } from '../../application/useAdminAuditEvents';
import { RegistrationCardHeading } from './RegistrationCardHeading';
import { AdminAuditFilters } from './AdminAuditFilters';
import { AdminAuditEventList } from './AdminAuditEventList';
export function AdminAuditCard({ state }: { state: ReturnType<typeof useAdminAuditEvents> }) {
  const { events, applyFilters } = state;
  return (
    <article
      aria-label="Nhật ký quản trị"
      className="profile-bento-card [&_select:focus-visible]:outline-2 [&_select:focus-visible]:outline-offset-2 [&_select:focus-visible]:outline-focus flex min-w-0 flex-col gap-5 p-5 sm:p-6"
    >
      <RegistrationCardHeading title="Nhật ký quản trị" icon="history" />
      <AdminAuditFilters onApply={applyFilters} />
      {events.isPending ? (
        <p role="status" className="m-0 text-body text-text-secondary">
          Đang tải nhật ký…
        </p>
      ) : (
        <>
          <AdminAuditEventList events={events} />
          {events.isError && (
            <div role="status">
              <p className="m-0 text-body text-text-secondary">Không tải được nhật ký. Thử lại.</p>
              <button
                type="button"
                className="rounded-2xl border border-border/45 bg-bg px-4 py-2 text-body text-text-primary disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus mt-3 min-h-11"
                disabled={events.isFetching || events.isFetchingNextPage}
                onClick={() => void (events.isFetchNextPageError ? events.fetchNextPage() : events.refetch())}
              >
                Thử lại
              </button>
            </div>
          )}
          {events.hasNextPage && !events.isError && (
            <button
              type="button"
              className="rounded-2xl border border-border/45 bg-bg px-4 py-2 text-body text-text-primary disabled:opacity-65 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus min-h-11 self-start"
              disabled={events.isFetching || events.isFetchingNextPage}
              onClick={() => {
                if (!events.isFetching) void events.fetchNextPage();
              }}
            >
              Tải thêm
            </button>
          )}
          {events.isFetchingNextPage && (
            <p role="status" className="m-0 text-body text-text-secondary">
              Đang tải thêm…
            </p>
          )}
        </>
      )}
    </article>
  );
}
