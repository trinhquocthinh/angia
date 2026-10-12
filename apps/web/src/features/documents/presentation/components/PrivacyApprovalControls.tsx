import { useState } from 'react';
import type { PrivacyEditorAction, PrivacyEditorState } from '../../application/privacyEditorState';
import { canApprovePrivacy } from '../../application/canApprovePrivacy';
import { privacyApprovalStep } from '../../application/privacyApprovalStep';
import { NoMaskWarning } from './NoMaskWarning';
type Props = {
  state: PrivacyEditorState;
  loaded: boolean;
  busy: boolean;
  dispatch: (action: PrivacyEditorAction) => void;
  onApprove: () => void;
};
// Component được gắn key theo bản kiểm tra: chỉnh ảnh tạo bản mới nên câu trả lời "vẫn gửi" không mang sang.
export function PrivacyApprovalControls({ state, loaded, busy, dispatch, onApprove }: Props) {
  const [asking, setAsking] = useState(false);
  const submit = (acknowledgedNoMask: boolean) => {
    const step = privacyApprovalStep(state, acknowledgedNoMask);
    setAsking(step === 'confirm-no-mask');
    if (step === 'approve') onApprove();
  };
  return (
    <>
      <label className="flex gap-3 text-sm leading-6 text-[#004135]">
        <input
          type="checkbox"
          checked={state.checked}
          disabled={!loaded || busy}
          onChange={(event) => {
            setAsking(false);
            dispatch({ type: 'check', checked: event.target.checked });
          }}
          className="mt-1 h-5 w-5 shrink-0 accent-[#286958]"
        />
        Tôi đã kiểm tra ảnh này và che các thông tin định danh trước khi gửi tới AI.
      </label>
      {asking && state.checked ? (
        <NoMaskWarning busy={busy} onBack={() => setAsking(false)} onSendAnyway={() => submit(true)} />
      ) : (
        <button
          type="button"
          disabled={!canApprovePrivacy(state) || busy}
          onClick={() => submit(false)}
          className="min-h-11 rounded-xl bg-[#286958] px-4 text-sm font-semibold text-white disabled:opacity-40"
        >
          Xác nhận và OCR
        </button>
      )}
    </>
  );
}
