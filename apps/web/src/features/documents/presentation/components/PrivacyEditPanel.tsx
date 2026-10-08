import { useState } from 'react';
import type { usePrivacyWorkspace } from '../../application/usePrivacyWorkspace';
import { PrivacyCanvas } from './PrivacyCanvas';
import { PrivacyEditorControls } from './PrivacyEditorControls';
type Props = { workspace: ReturnType<typeof usePrivacyWorkspace>; documentId: string };
export function PrivacyEditPanel({ workspace, documentId }: Props) {
  const [mode, setMode] = useState<'crop' | 'mask'>('mask');
  const [preview, setPreview] = useState(false);
  const { state, dispatch, busy, query } = workspace;
  const creating = state.candidate.state === 'pending' || query.data?.draft.state === 'pending';
  return (
    <div className="flex flex-col gap-3 rounded-[20px] bg-white p-4">
      <h3 className="text-lg font-semibold text-[#004135]">Cắt và che thông tin định danh</h3>
      <p className="text-sm leading-6 text-[#55615f]">
        Chỉ giữ nội dung cần đọc. Che họ tên, địa chỉ và thông tin định danh bằng vùng đen. Ảnh chưa được gửi
        tới AI.
      </p>
      <PrivacyCanvas
        documentId={documentId}
        edits={state.edits}
        mode={mode}
        disabled={busy || (mode === 'mask' && state.edits.masks.length >= 32)}
        onPreview={setPreview}
        onBegin={() => dispatch({ type: 'invalidate' })}
        onRectangle={(rectangle) => dispatch({ type: mode, rectangle })}
      />
      <PrivacyEditorControls
        state={state}
        dispatch={dispatch}
        mode={mode}
        setMode={setMode}
        disabled={busy || !preview}
      />
      <button
        type="button"
        onClick={() => void workspace.create()}
        disabled={busy || !preview || creating || query.isPending || query.isError}
        className="min-h-11 rounded-xl bg-[#286958] px-4 text-sm font-semibold text-white disabled:opacity-40"
      >
        {creating ? 'Đang tạo bản kiểm tra…' : 'Tạo bản kiểm tra'}
      </button>
    </div>
  );
}
