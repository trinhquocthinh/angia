import { useRef } from 'react';
import type { PointerEvent } from 'react';
import { CORNER_LABELS, nudgeCorner, pointerToUnit, setCorner } from '../../application/scanCorners';
import type { Quad } from '../../application/scanTypes';

type Props = {
  quad: Quad;
  disabled: boolean;
  onChange: (quad: Quad) => void;
};

// SPEC-084: 4 tay nắm là nút thật (bàn phím, trình đọc màn hình); hộp đo là khung ảnh đã xoay.
export function ScanCornerOverlay({ quad, disabled, onChange }: Props) {
  const box = useRef<HTMLDivElement>(null);
  const move = (index: number, event: PointerEvent<HTMLButtonElement>) => {
    if (!box.current || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    onChange(
      setCorner(
        quad,
        index,
        pointerToUnit(event.clientX, event.clientY, box.current.getBoundingClientRect()),
      ),
    );
  };
  return (
    <div ref={box} className="absolute inset-0 touch-none">
      <svg
        aria-hidden="true"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        <polygon
          points={quad.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
          fill="rgba(127,224,198,0.15)"
          stroke="#7fe0c6"
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {quad.map((point, index) => (
        <button
          key={CORNER_LABELS[index]}
          type="button"
          aria-label={`${CORNER_LABELS[index]}. Dùng phím mũi tên để dịch, giữ Shift để dịch nhanh.`}
          disabled={disabled}
          className="absolute size-11 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-[#004135]/80 shadow-lg focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#7fe0c6] disabled:opacity-40"
          style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
          onPointerDown={(event) => !disabled && event.currentTarget.setPointerCapture(event.pointerId)}
          onPointerMove={(event) => move(index, event)}
          onPointerUp={(event) => event.currentTarget.releasePointerCapture(event.pointerId)}
          onKeyDown={(event) => {
            const next = nudgeCorner(quad, index, event.key, event.shiftKey);
            if (!next) return;
            event.preventDefault();
            onChange(next);
          }}
        />
      ))}
    </div>
  );
}
