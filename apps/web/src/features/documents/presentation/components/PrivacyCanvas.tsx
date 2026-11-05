import { useState } from 'react';
import { PrivacyToolIcon } from './PrivacyToolIcon';
import type { PrivacyEdits, PrivacyRectangle } from '@angia/contracts';
import { usePrivacyDrag } from '../../application/usePrivacyDrag';
import { PrivacyPreviewImage } from './PrivacyPreviewImage';
import { PrivacyOverlay } from './PrivacyOverlay';
type Props = {
  src: string;
  edits: PrivacyEdits;
  mode: 'crop' | 'mask';
  disabled: boolean;
  onBegin: () => void;
  onRectangle: (rect: PrivacyRectangle) => void;
  onPreview: (loaded: boolean) => void;
};
export function PrivacyCanvas({ src, edits, mode, disabled, onBegin, onRectangle, onPreview }: Props) {
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const gesture = usePrivacyDrag(disabled || !loaded, onBegin, onRectangle);
  const rotated = edits.rotation === 90 || edits.rotation === 270;
  return (
    <div className="rounded-xl bg-[#273232] p-2 text-[#deebea] shadow-inner sm:p-4">
      {failed && (
        <p role="alert" className="p-4 text-sm text-[#ffb68c]">
          Không mở được ảnh này trên trình duyệt. Hãy chụp lại hoặc chọn ảnh JPG.
        </p>
      )}
      <div className="flex h-[clamp(320px,52dvh,520px)] items-center justify-center">
        <div
          className="relative w-full overflow-hidden rounded shadow-2xl"
          style={{
            aspectRatio: rotated ? size.height / size.width : size.width / size.height,
            maxWidth: `min(100%, calc(${rotated ? size.height / size.width : size.width / size.height} * clamp(320px, 52dvh, 520px)))`,
          }}
        >
          <PrivacyPreviewImage
            src={src}
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
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] leading-4">
          <span className="flex items-center gap-1.5">
            <PrivacyToolIcon name="pointer" />
            Kéo trên ảnh để tạo vùng cắt hoặc che
          </span>
          <span className="font-mono text-[#bfc9c4]">
            Xem trước: {rotated ? size.height : size.width} × {rotated ? size.width : size.height}
          </span>
        </div>
      )}
      {!loaded && !failed && (
        <p role="status" className="p-2 text-sm text-[#bfc9c4]">
          Đang tải ảnh xem trước…
        </p>
      )}
    </div>
  );
}
