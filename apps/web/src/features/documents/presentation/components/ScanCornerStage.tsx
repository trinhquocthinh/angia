import type { Quad } from '../../application/scanTypes';
import { PrivacyPreviewImage } from './PrivacyPreviewImage';
import { ScanCornerOverlay } from './ScanCornerOverlay';

type Size = { width: number; height: number };
type Props = {
  src: string;
  rotation: number;
  /** Kích thước gốc của ảnh (chưa xoay), null khi chưa tải xong. */
  size: Size | null;
  quad: Quad;
  disabled: boolean;
  onQuad: (quad: Quad) => void;
  onSize: (size: Size) => void;
  onError: () => void;
};

// Khung ảnh đã xoay như PrivacyCanvas, để toạ độ 4 góc cùng hệ với ảnh người dùng đang thấy.
export function ScanCornerStage({ src, rotation, size, quad, disabled, onQuad, onSize, onError }: Props) {
  const turned = rotation === 90 || rotation === 270;
  const ratio = size ? (turned ? size.height / size.width : size.width / size.height) : 1;
  return (
    <div
      className="relative w-full overflow-hidden rounded"
      style={{ aspectRatio: ratio, maxWidth: `min(100%, calc(${ratio} * clamp(320px, 52dvh, 520px)))` }}
    >
      <PrivacyPreviewImage
        src={src}
        rotation={rotation}
        size={size ?? { width: 1, height: 1 }}
        failed={false}
        onLoad={(width, height) => onSize({ width, height })}
        onError={onError}
      />
      {size && <ScanCornerOverlay quad={quad} disabled={disabled} onChange={onQuad} />}
    </div>
  );
}
