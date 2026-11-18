import { Button } from '@src/shared/ui/button/Button';
import { InvitationHeading } from './InvitationHeading';
export function InvitationManagementLoading({ error, retry }: { error: boolean; retry: () => void }) {
  return (
    <section className="household-invite" aria-labelledby="household-invite-title">
      <InvitationHeading status="active" />
      {error ? (
        <>
          <p role="alert">Chưa thể tải lời mời. Vui lòng thử lại.</p>
          <Button onClick={retry}>Thử tải lại</Button>
        </>
      ) : (
        <p role="status">Đang tải lời mời…</p>
      )}
    </section>
  );
}
