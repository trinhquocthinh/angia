import { InvitationSummary } from './InvitationSummary';
import { InvitationExpiry } from './InvitationExpiry';
import type { useConsentInvitation } from '../../application/useConsentInvitation';
import { InvitationResponseForm } from './InvitationResponseForm';
import { InvitationTerminal } from './InvitationTerminal';
export function InvitationContent({ workspace }: { workspace: ReturnType<typeof useConsentInvitation> }) {
  const { loaded, receipt, error, pending, respond, retry } = workspace;
  if (loaded.state === 'loading')
    return (
      <p role="status" className="text-sm">
        Đang mở lời mời…
      </p>
    );
  if (loaded.state === 'unavailable')
    return (
      <section>
        <h2 className="auth-heading text-2xl text-[#004135]">Link không còn khả dụng</h2>
        <p className="mt-4 text-sm leading-7">
          Link có thể đã hết hạn hoặc bị thu hồi. Bạn có thể liên hệ người mời để nhận link mới.
        </p>
      </section>
    );
  if (loaded.state === 'error')
    return (
      <div role="alert">
        <p className="text-sm leading-7">Không thể mở lời mời. Vui lòng kiểm tra kết nối SIT/Tailscale.</p>
        <button
          onClick={retry}
          className="mt-4 min-h-11 rounded-xl bg-[#004135] px-5 py-3 text-sm text-white"
        >
          Thử lại
        </button>
      </div>
    );
  const view = loaded.view;
  const terminal = receipt?.decision ?? (view.status === 'pending' ? null : view.status);
  return (
    <section>
      <InvitationSummary view={view} />
      <InvitationExpiry expiresAt={view.expiresAt} />
      {terminal ? (
        <InvitationTerminal status={terminal} receipt={receipt} />
      ) : (
        <InvitationResponseForm pending={pending} onRespond={respond} />
      )}
      {error && (
        <p role="alert" className="mt-4 text-sm leading-6 text-[#b42318]">
          {error}
        </p>
      )}
    </section>
  );
}
