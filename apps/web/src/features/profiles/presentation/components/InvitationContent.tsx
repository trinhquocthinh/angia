import { InvitationSummary } from './InvitationSummary';
import { InvitationExpiry } from './InvitationExpiry';
import type { useLinkInvitation } from '../../application/useLinkInvitation';
import { InvitationBlocked } from './InvitationBlocked';
import { InvitationLoadError } from './InvitationLoadError';
import { InvitationNotice } from './InvitationNotice';
import { InvitationResponseActions } from './InvitationResponseActions';
import { InvitationTerminal } from './InvitationTerminal';
export function InvitationContent({
  workspace,
  accountName,
}: {
  workspace: ReturnType<typeof useLinkInvitation>;
  accountName: string;
}) {
  const { loaded, receipt, error, pending, respond, retry } = workspace;
  if (loaded.state === 'loading')
    return (
      <p role="status" className="text-sm">
        Đang mở link…
      </p>
    );
  if (loaded.state === 'missing')
    return (
      <InvitationNotice title="Hãy mở lại link">
        Bạn đang đăng nhập là <strong>{accountName}</strong>. Hãy mở lại link được gửi cho bạn để tiếp tục.
      </InvitationNotice>
    );
  if (loaded.state === 'unavailable')
    return (
      <InvitationNotice title="Link không còn khả dụng">
        Link có thể đã được dùng, đã hết hạn hoặc bị thu hồi. Hãy nhờ người quản lý gia đình gửi link mới.
      </InvitationNotice>
    );
  if (loaded.state === 'error') return <InvitationLoadError onRetry={retry} />;
  const view = loaded.view;
  if (receipt) return <InvitationTerminal receipt={receipt} />;
  return (
    <section>
      <InvitationSummary view={view} />
      <InvitationExpiry expiresAt={view.expiresAt} />
      {view.canAccept ? (
        <InvitationResponseActions
          view={view}
          accountName={accountName}
          pending={pending}
          onDecision={(decision) => void respond(decision)}
        />
      ) : (
        <InvitationBlocked reason={view.reason} />
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm leading-6 text-danger">
          {error}
        </p>
      )}
    </section>
  );
}
