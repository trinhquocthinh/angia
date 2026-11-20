import { ClayIcon } from '@src/shared/ui/ClayIcon';
import { Button } from '@src/shared/ui/button/Button';
import type { IssuedInvitation } from '../../application/invitationPorts';
import { useInvitationSharing } from '../../application/useInvitationSharing';
import { invitationIsExpired } from '../../application/invitationIsExpired';
import { createInvitationSharing } from '../../infrastructure/invitationSharing';
import { InvitationToast } from './InvitationToast';
import { InvitationCopyFeedback } from './InvitationCopyFeedback';

const sharing = createInvitationSharing();
export function InvitationShareActions({
  invitation,
  disabled,
}: {
  invitation: IssuedInvitation;
  disabled: boolean;
}) {
  const model = useInvitationSharing(sharing);
  const available = () => !disabled && !invitationIsExpired(invitation.expiresAt, Date.now());
  const text = `Mời bạn tham gia nhà trên AN GIA. Mã mời: ${invitation.code}.\n${invitation.link}`;
  return (
    <div className="household-invite-share">
      <Button
        className="household-invite-primary"
        disabled={disabled}
        onClick={() => {
          if (!available()) return;
          void (model.canShare
            ? model.share(invitation)
            : model.copy(text, 'Đã sao chép lời mời. Dán vào Zalo để gửi cho người thân.'));
        }}
      >
        <ClayIcon name="send" size={24} />
        {model.canShare ? 'Gửi qua Zalo' : 'Sao chép lời mời'}
      </Button>
      <p className="household-invite-share-hint">
        {model.canShare
          ? 'Chọn Zalo trong danh sách chia sẻ.'
          : 'Dán lời mời vào Zalo để gửi cho người thân.'}
      </p>
      <div className="household-invite-copy-actions">
        <Button
          variant="secondary"
          disabled={disabled}
          onClick={() => {
            if (available()) void model.copy(invitation.code, 'Đã sao chép mã mời.');
          }}
        >
          <ClayIcon name="copy" size={24} />
          Sao chép mã
        </Button>
        <Button
          variant="secondary"
          disabled={disabled}
          onClick={() => {
            if (available()) void model.copy(invitation.link, 'Đã sao chép link lời mời.');
          }}
        >
          <ClayIcon name="link" size={24} />
          Sao chép link
        </Button>
      </div>
      <InvitationCopyFeedback message="" manual={model.manual} disabled={disabled} />
      <InvitationToast message={model.message} sequence={model.sequence} />
    </div>
  );
}
