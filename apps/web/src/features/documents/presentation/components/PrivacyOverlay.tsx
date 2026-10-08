import type { PrivacyEdits, PrivacyRectangle } from '@angia/contracts';
import type { usePrivacyDrag } from '../../application/usePrivacyDrag';
type Props = {
  edits: PrivacyEdits;
  mode: 'crop' | 'mask';
  disabled: boolean;
  gesture: ReturnType<typeof usePrivacyDrag>;
};
export function PrivacyOverlay({ edits, mode, disabled, gesture }: Props) {
  const rect = gesture.rectangle;
  return (
    <svg
      aria-label="Vùng chỉnh ảnh"
      viewBox="0 0 1000000 1000000"
      preserveAspectRatio="none"
      className="absolute inset-0 h-full w-full touch-none"
      style={{ cursor: disabled ? 'default' : 'crosshair' }}
      onPointerDown={gesture.down}
      onPointerMove={gesture.move}
      onPointerUp={gesture.up}
      onPointerCancel={gesture.cancel}
      onLostPointerCapture={gesture.cancel}
    >
      {edits.masks.map((mask: PrivacyRectangle, index: number) => (
        <rect key={index} x={mask.left} y={mask.top} width={mask.width} height={mask.height} fill="black" />
      ))}
      <rect
        x={edits.crop.left}
        y={edits.crop.top}
        width={edits.crop.width}
        height={edits.crop.height}
        fill="none"
        stroke="#286958"
        strokeWidth={3}
        vectorEffect="non-scaling-stroke"
      />
      {rect && (
        <rect
          x={rect.left}
          y={rect.top}
          width={rect.width}
          height={rect.height}
          fill={mode === 'mask' ? 'black' : 'none'}
          stroke="#286958"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      )}
    </svg>
  );
}
