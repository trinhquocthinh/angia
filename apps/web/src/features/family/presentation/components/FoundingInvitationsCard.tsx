import { CreateFoundingInvitationButton } from './CreateFoundingInvitationButton';
import { useState } from 'react';
import type { useFoundingInvitations } from '../../application/useFoundingInvitations';
import { RegistrationCardHeading } from './RegistrationCardHeading';
import { FoundingInvitationItem } from './FoundingInvitationItem';
import { FoundingInvitationRevokeDialog } from './FoundingInvitationRevokeDialog';

export function FoundingInvitationsCard({
  items,
  notice,
  create,
  revoke,
}: ReturnType<typeof useFoundingInvitations>) {
  const [target, setTarget] = useState<string | null>(null);
  return (
    <article
      aria-label="Lời mời lập nhà"
      className="profile-bento-card flex min-w-0 flex-col gap-5 p-5 sm:p-6"
    >
      <RegistrationCardHeading title="Lời mời lập nhà" icon="vpn_key" />
      <CreateFoundingInvitationButton pending={create.isPending} onCreate={() => create.mutate()} />
      <p className="m-0 text-caption text-text-secondary">
        Link và mã chỉ hiện một lần; tải lại trang sẽ không xem lại được.
      </p>
      {create.isError && (
        <p role="alert" className="m-0 text-danger">
          Không tạo được lời mời. Thử lại sau.
        </p>
      )}
      {notice && (
        <p role="status" className="m-0">
          {notice}
        </p>
      )}
      <div data-modal-return-focus tabIndex={-1} className="flex min-w-0 flex-col gap-3">
        {items.map((invitation) => (
          <FoundingInvitationItem
            key={invitation.invitationId}
            invitation={invitation}
            pending={revoke.isPending}
            onRevoke={() => {
              revoke.reset();
              setTarget(invitation.invitationId);
            }}
          />
        ))}
        {target !== null && (
          <FoundingInvitationRevokeDialog
            pending={revoke.isPending}
            error={revoke.error ? 'Không thu hồi được lời mời. Thử lại sau.' : null}
            onClose={() => setTarget(null)}
            onConfirm={() => revoke.mutate(target, { onSuccess: () => setTarget(null) })}
          />
        )}
      </div>
    </article>
  );
}
