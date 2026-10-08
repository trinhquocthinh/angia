import { useState } from 'react';
import type { PrivacyEdits, PrivacyRectangle } from '@angia/contracts';
import { usePrivacyDrag } from '../../application/usePrivacyDrag';
import { PrivacyPreviewImage } from './PrivacyPreviewImage';
import { PrivacyOverlay } from './PrivacyOverlay';
type Props = {
  documentId: string;
  edits: PrivacyEdits;
  mode: 'crop' | 'mask';
  disabled: boolean;
  onBegin: () => void;
  onRectangle: (rect: PrivacyRectangle) => void;
  onPreview: (loaded: boolean) => void;
};
export function PrivacyCanvas({ documentId, edits, mode, disabled, onBegin, onRectangle, onPreview }: Props) {
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const gesture = usePrivacyDrag(disabled || !loaded, onBegin, onRectangle);
  const rotated = edits.rotation === 90 || edits.rotation === 270;
  return (
    <div className="overflow-hidden rounded-xl bg-[#eaf6f5] p-2">
      {failed && (
        <p role="alert" className="p-4 text-sm text-[#9b472c]">
          Không tải được ảnh xem trước. Tải lại chứng từ hoặc chọn nhập tay.
        </p>
      )}
      <div
        className="relative w-full overflow-hidden bg-white"
        style={{ aspectRatio: rotated ? size.height / size.width : size.width / size.height }}
      >
        <PrivacyPreviewImage
          documentId={documentId}
          rotation={edits.rotation}
          size={size}
          failed={failed}
          onLoad={(width, height) => {
            setSize({ width, height });
            setLoaded(true);
            onPreview(true);
          }}
          onError={() => {
            setFailed(true);
            setLoaded(false);
            onPreview(false);
          }}
        />
        <PrivacyOverlay edits={edits} mode={mode} disabled={disabled || !loaded} gesture={gesture} />
      </div>
      {!loaded && !failed && (
        <p role="status" className="p-2 text-sm text-[#55615f]">
          Đang tải ảnh xem trước…
        </p>
      )}
    </div>
  );
}
