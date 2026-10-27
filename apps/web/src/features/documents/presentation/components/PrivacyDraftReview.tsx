import type { FamilyUsage } from '@angia/contracts';
import { useState } from 'react';
import type { PrivacyEditorAction, PrivacyEditorState } from '../../application/privacyEditorState';
import { PrivacyCandidateImage } from './PrivacyCandidateImage';
import { PrivacyApprovalControls } from './PrivacyApprovalControls';
import { PrivacyReviewDialog } from './PrivacyReviewDialog';
import { PrivacyReviewReopen } from './PrivacyReviewReopen';
type Props = {
  state: PrivacyEditorState;
  busy: boolean;
  dispatch: (action: PrivacyEditorAction) => void;
  onApprove: () => void;
  aiExhausted?: boolean;
  aiReason?: FamilyUsage['aiOcr']['reason'];
  onManual?: () => void;
};
// Được gắn key theo bản kiểm tra nên bản mới luôn tự mở hộp thoại.
export function PrivacyDraftReview(props: Props) {
  const { state, busy, dispatch, onApprove, aiExhausted, aiReason, onManual } = props;
  const [open, setOpen] = useState(true);
  const draft = state.candidate;
  if (draft.state === 'pending')
    return (
      <p role="status" className="text-sm text-[#55615f]">
        Đang tạo bản kiểm tra. Ảnh chưa được gửi để tự động nhận diện.
      </p>
    );
  if (draft.state === 'failed')
    return (
      <p role="alert" className="text-sm text-[#9b472c]">
        Không tạo được bản kiểm tra. Thử cắt vùng nhỏ hơn rồi tạo lại hoặc chọn nhập tay.
      </p>
    );
  if (draft.state !== 'ready')
    return (
      <p className="text-sm text-[#55615f]">Tạo bản kiểm tra để xem đúng ảnh sẽ gửi để tự động nhận diện.</p>
    );
  if (state.candidateRevision !== state.revision)
    return (
      <p role="status" className="text-sm text-[#55615f]">
        Ảnh đã được chỉnh lại. Tạo bản kiểm tra mới để tiếp tục.
      </p>
    );
  const loaded = state.loaded === `${draft.draftId}:${draft.sha256}`;
  if (!open) return <PrivacyReviewReopen onOpen={() => setOpen(true)} />;
  return (
    <PrivacyReviewDialog
      busy={busy}
      onClose={() => setOpen(false)}
      image={
        <PrivacyCandidateImage
          key={`${draft.draftId}:${draft.sha256}`}
          draft={draft}
          loaded={loaded}
          dispatch={dispatch}
        />
      }
      controls={
        <PrivacyApprovalControls
          state={state}
          loaded={loaded}
          busy={busy}
          dispatch={dispatch}
          onApprove={onApprove}
          aiExhausted={aiExhausted ?? false}
          aiReason={aiReason}
          onManual={onManual ?? (() => undefined)}
        />
      }
    />
  );
}
