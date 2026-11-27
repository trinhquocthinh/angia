import { useInvitationClipboard } from './useInvitationClipboard';
import { useId } from 'react';
import type { FoundingInvitation } from '../../application/ports';

type Props = { invitation: FoundingInvitation; pending: boolean; onRevoke: () => void };
export function FoundingInvitationItem({ invitation, pending, onRevoke }: Props) {
  const id = useId();
  const { notice, copy } = useInvitationClipboard();
  const date = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Ho_Chi_Minh',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(invitation.expiresAt));
  return (
    <div className="flex min-w-0 flex-col gap-3 rounded-2xl bg-bg p-4">
      <p className="m-0 break-all text-heading-1 font-semibold tabular-nums select-text">{invitation.code}</p>
      <p className="m-0 text-caption text-text-secondary">Hết hạn {date}</p>
      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <label htmlFor={id} className="sr-only">
          Link lời mời lập nhà
        </label>
        <input
          id={id}
          value={invitation.link}
          readOnly
          className="min-h-12 w-full min-w-0 flex-1 basis-40 truncate rounded-xl border border-border bg-surface px-3 text-text-primary select-text"
        />
        <button
          type="button"
          aria-label="Sao chép link"
          onClick={() => void copy(invitation.link)}
          className="min-h-12 rounded-xl border border-border px-4 text-accent"
        >
          Sao chép link
        </button>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          aria-label="Sao chép mã"
          onClick={() => void copy(invitation.code)}
          className="min-h-12 rounded-xl border border-border px-4 text-accent"
        >
          Sao chép mã
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onRevoke}
          className="min-h-12 rounded-xl border border-border px-4 text-danger"
        >
          Thu hồi
        </button>
      </div>
      {notice && (
        <p role="status" className="m-0 text-caption">
          {notice}
        </p>
      )}
    </div>
  );
}
