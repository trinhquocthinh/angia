import { Button } from '@src/shared/ui/button/Button';
import type { useHouseholdInvitationLink } from '../../application/useHouseholdInvitationLink';
import { CreateHouseholdForm } from '../start/CreateHouseholdForm';

type Props = {
  model: ReturnType<typeof useHouseholdInvitationLink>;
  csrfToken: string;
  refresh: () => Promise<unknown>;
};
export function HouseholdInvitationLinkContent({ model, csrfToken, refresh }: Props) {
  if (model.phase === 'found_family')
    return (
      <CreateHouseholdForm token={csrfToken} invitationToken={model.invitationToken!} refresh={refresh} />
    );
  const joining = model.phase === 'join_family';
  const inspecting = model.phase === 'inspecting';
  return (
    <section className="household-start-panel household-join" aria-busy={inspecting || model.busy}>
      <h1>{joining ? 'Nhận lời mời vào nhà' : 'Lời mời vào nhà'}</h1>
      {inspecting && <p role="status">Đang kiểm tra lời mời…</p>}
      {joining && (
        <p className="household-start-description">
          Bạn được mời tham gia một nhà với vai trò {model.role === 'main' ? 'Đồng quản lý' : 'Thành viên'}.
        </p>
      )}
      {model.message && (
        <p role="alert" className="text-danger">
          {model.message}
        </p>
      )}
      {joining && (
        <Button disabled={model.busy || !csrfToken} onClick={() => void model.accept()}>
          {model.busy ? 'Đang xác nhận…' : model.accepted ? 'Tải lại thông tin nhà' : 'Nhận lời mời'}
        </Button>
      )}
      {model.canRetry && <Button onClick={() => void model.retry()}>Thử lại</Button>}
      {!inspecting && (
        <Button disabled={model.busy} onClick={() => void model.decline()}>
          {joining && !model.accepted ? 'Không nhận' : 'Về trang chủ'}
        </Button>
      )}
    </section>
  );
}
