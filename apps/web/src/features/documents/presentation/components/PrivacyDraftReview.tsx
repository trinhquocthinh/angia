import type { PrivacyEditorAction, PrivacyEditorState } from '../../application/privacyEditorState';
import { PrivacyCandidateImage } from './PrivacyCandidateImage';
import { PrivacyApprovalControls } from './PrivacyApprovalControls';
type Props = {
  state: PrivacyEditorState;
  busy: boolean;
  dispatch: (action: PrivacyEditorAction) => void;
  onApprove: () => void;
};
export function PrivacyDraftReview({ state, busy, dispatch, onApprove }: Props) {
  const draft = state.candidate;
  if (draft.state === 'pending')
    return (
      <p role="status" className="text-sm text-[#55615f]">
        Đang tạo bản kiểm tra. Ảnh chưa được gửi tới AI.
      </p>
    );
  if (draft.state === 'failed')
    return (
      <p role="alert" className="text-sm text-[#9b472c]">
        Không tạo được bản kiểm tra. Thử cắt vùng nhỏ hơn rồi tạo lại hoặc chọn nhập tay.
      </p>
    );
  if (draft.state !== 'ready')
    return <p className="text-sm text-[#55615f]">Tạo bản kiểm tra để xem đúng ảnh sẽ gửi tới AI.</p>;
  if (state.candidateRevision !== state.revision)
    return (
      <p role="status" className="text-sm text-[#55615f]">
        Ảnh đã được chỉnh lại. Tạo bản kiểm tra mới để tiếp tục.
      </p>
    );
  const loaded = state.loaded === `${draft.draftId}:${draft.sha256}`;
  return (
    <section
      aria-label="Bản kiểm tra trước khi gửi AI"
      className="flex flex-col gap-3 rounded-2xl border border-[#d6e5df] bg-white p-4"
    >
      <h3 className="font-semibold text-[#004135]">Kiểm tra ảnh sẽ gửi tới AI</h3>
      <p className="text-sm text-[#55615f]">
        Đọc lại ảnh bên dưới, kiểm tra họ tên, địa chỉ và các thông tin định danh đã được che.
      </p>
      <PrivacyCandidateImage
        key={`${draft.draftId}:${draft.sha256}`}
        draft={draft}
        loaded={loaded}
        dispatch={dispatch}
      />
      <PrivacyApprovalControls
        state={state}
        loaded={loaded}
        busy={busy}
        dispatch={dispatch}
        onApprove={onApprove}
      />
    </section>
  );
}
