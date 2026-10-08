import { useState } from 'react';
import type { PrivacyDraft } from '@angia/contracts';
import type { PrivacyEditorAction } from '../../application/privacyEditorState';
type Props = {
  draft: Extract<PrivacyDraft, { state: 'ready' }>;
  loaded: boolean;
  dispatch: (action: PrivacyEditorAction) => void;
};
export function PrivacyCandidateImage({ draft, loaded, dispatch }: Props) {
  const [zoom, setZoom] = useState(1);
  const [failed, setFailed] = useState(false);
  return (
    <>
      <div className="flex items-center gap-2 text-sm text-[#004135]">
        <label htmlFor={`privacy-zoom-${draft.draftId}`}>Phóng to</label>
        <select
          id={`privacy-zoom-${draft.draftId}`}
          value={zoom}
          onChange={(event) => setZoom(Number(event.target.value))}
          className="min-h-11 rounded-lg border border-[#d6e5df] px-2"
        >
          <option value={1}>100%</option>
          <option value={2}>200%</option>
          <option value={3}>300%</option>
        </select>
      </div>
      <div className="max-h-[70vh] overflow-auto rounded-lg bg-[#eaf6f5]">
        <img
          src={draft.imageUrl}
          alt="Bản kiểm tra chính xác sẽ gửi tới AI"
          className="block max-w-none"
          style={{ width: `${zoom * 100}%` }}
          onLoad={() => {
            setFailed(false);
            dispatch({ type: 'loaded', draftId: draft.draftId, sha256: draft.sha256 });
          }}
          onError={() => {
            setFailed(true);
            dispatch({ type: 'image-failed' });
          }}
        />
      </div>
      {failed && (
        <p role="alert" className="text-sm text-[#9b472c]">
          Không tải được bản kiểm tra. Tạo lại ảnh trước khi xác nhận.
        </p>
      )}
      {!loaded && !failed && (
        <p role="status" className="text-sm text-[#55615f]">
          Đang tải bản kiểm tra…
        </p>
      )}
    </>
  );
}
