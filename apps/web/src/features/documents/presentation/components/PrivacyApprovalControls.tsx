import type { PrivacyEditorAction, PrivacyEditorState } from '../../application/privacyEditorState';
import { canApprovePrivacy } from '../../application/canApprovePrivacy';
type Props = {
  state: PrivacyEditorState;
  loaded: boolean;
  busy: boolean;
  dispatch: (action: PrivacyEditorAction) => void;
  onApprove: () => void;
};
export function PrivacyApprovalControls({ state, loaded, busy, dispatch, onApprove }: Props) {
  return (
    <>
      <label className="flex gap-3 text-sm leading-6 text-[#004135]">
        <input
          type="checkbox"
          checked={state.checked}
          disabled={!loaded || busy}
          onChange={(event) => dispatch({ type: 'check', checked: event.target.checked })}
          className="mt-1 h-5 w-5 shrink-0 accent-[#286958]"
        />
        Tôi đã kiểm tra ảnh này và che các thông tin định danh trước khi gửi tới AI.
      </label>
      <button
        type="button"
        disabled={!canApprovePrivacy(state) || busy}
        onClick={onApprove}
        className="min-h-11 rounded-xl bg-[#286958] px-4 text-sm font-semibold text-white disabled:opacity-40"
      >
        Xác nhận và OCR
      </button>
    </>
  );
}
