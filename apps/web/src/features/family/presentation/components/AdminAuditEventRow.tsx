import type { AdminAuditEvent } from '../../application/ports';
import { adminAuditActionLabel } from '../../application/adminAuditActionLabel';
import { formatAdminVietnamTime } from '../../application/formatAdminVietnamTime';
import { shortenAdminId } from '../../application/shortenAdminId';
export function AdminAuditEventRow({ event }: { event: AdminAuditEvent }) {
  const targets = [
    ...(event.familyId ? [{ label: 'Nhà', id: event.familyId }] : []),
    ...(event.targetAccountId ? [{ label: 'Đối tượng: tài khoản', id: event.targetAccountId }] : []),
    ...(event.targetProfileId ? [{ label: 'hồ sơ', id: event.targetProfileId }] : []),
  ];
  return (
    <li className="flex min-w-0 flex-col gap-1 rounded-2xl border border-border/45 bg-bg p-4 break-words">
      <p className="m-0 text-caption text-text-secondary tabular-nums">
        <time dateTime={event.occurredAt}>{formatAdminVietnamTime(event.occurredAt)}</time>
        {' · '}
        {event.actorAccountId === 'system_admin' ? (
          'Quản trị hệ thống'
        ) : (
          <span title={event.actorAccountId}>Tài khoản {shortenAdminId(event.actorAccountId)}</span>
        )}
      </p>
      <p className="m-0 text-body text-text-primary">{adminAuditActionLabel(event.action)}</p>
      {targets.length > 0 && (
        <p className="m-0 text-caption text-text-secondary">
          {targets.map((target, index) => (
            <span key={target.label}>
              {index > 0 && ' · '}
              <span title={target.id}>
                {target.label} {shortenAdminId(target.id)}
              </span>
            </span>
          ))}
        </p>
      )}
    </li>
  );
}
