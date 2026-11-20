import type { GuardianCandidate } from '../../application/guardianPorts';
import { GuardianCandidateOption } from './GuardianCandidateOption';

type Props = {
  candidates: GuardianCandidate[];
  loading: boolean;
  loadError: boolean;
  selectedId: string;
  disabled: boolean;
  onSelect: (accountId: string) => void;
  onRetryLoad: () => void;
};

export function AddGuardianCandidateList(props: Props) {
  if (props.loading) {
    return <p className="profile-guardian-empty">Đang tải danh sách thành viên…</p>;
  }
  if (props.loadError) {
    return (
      <div role="alert" className="profile-guardian-banner">
        <span>Chưa tải được danh sách thành viên.</span>{' '}
        <button type="button" className="font-semibold underline" onClick={props.onRetryLoad}>
          Thử lại
        </button>
      </div>
    );
  }
  if (props.candidates.length === 0) {
    return (
      <p className="profile-guardian-empty">
        Chưa có người phù hợp. Chỉ Chủ hộ hoặc Đồng quản lý cùng nhà mới làm được người giám hộ.
      </p>
    );
  }
  return (
    <div className="profile-guardian-candidates" role="radiogroup" aria-label="Chọn người giám hộ">
      {props.candidates.map((candidate) => (
        <GuardianCandidateOption
          key={candidate.accountId}
          candidate={candidate}
          selected={props.selectedId === candidate.accountId}
          disabled={props.disabled}
          onSelect={props.onSelect}
        />
      ))}
    </div>
  );
}
