import { useState } from 'react';
import { PrivacyToolIcon } from './PrivacyToolIcon';
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
    <div className="overflow-hidden rounded-2xl bg-[#131d1d] text-[#e7f3f3]">
      {failed && (
        <p role="alert" className="p-4 text-sm text-[#9b472c]">
          Không tải được ảnh xem trước. Tải lại chứng từ hoặc chọn nhập tay.
        </p>
      )}
      <div className="flex h-[clamp(320px,52dvh,520px)] items-center justify-center">
        <div
          className="relative w-full overflow-hidden"
          style={{
            aspectRatio: rotated ? size.height / size.width : size.width / size.height,
            maxWidth: `min(100%, calc(${rotated ? size.height / size.width : size.width / size.height} * clamp(320px, 52dvh, 520px)))`,
          }}
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
      </div>
      {loaded && (
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[#273232] px-3 py-2 text-[11px] leading-4">
          <span className="flex items-center gap-1.5">
            <PrivacyToolIcon name="pointer" />
            Kéo trên ảnh để tạo vùng cắt hoặc che
          </span>
          <span>
            Xem trước: {rotated ? size.height : size.width} × {rotated ? size.width : size.height}
          </span>
        </div>
      )}
      {!loaded && !failed && (
        <p role="status" className="p-2 text-sm text-[#55615f]">
          Đang tải ảnh xem trước…
        </p>
      )}
    </div>
  );
}
