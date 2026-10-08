import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';
import type { PrivacyRectangle } from '@angia/contracts';
import { privacyPoint } from './privacyPoint';
import { privacyDragRectangle } from './privacyDragRectangle';
import type { PrivacyPoint } from './privacyPoint';
type Drag = { pointerId: number; start: PrivacyPoint; end: PrivacyPoint };
export function usePrivacyDrag(
  disabled: boolean,
  onBegin: () => void,
  onRectangle: (rect: PrivacyRectangle) => void,
) {
  const [drag, setDrag] = useState<Drag | null>(null);
  const gesture = useRef<Drag | null>(null);
  const point = (event: PointerEvent<SVGSVGElement>) =>
    privacyPoint(event.clientX, event.clientY, event.currentTarget.getBoundingClientRect());
  const down = (event: PointerEvent<SVGSVGElement>) => {
    if (disabled || gesture.current || event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const start = point(event);
    gesture.current = { pointerId: event.pointerId, start, end: start };
    setDrag(gesture.current);
    onBegin();
  };
  const move = (event: PointerEvent<SVGSVGElement>) => {
    if (gesture.current?.pointerId !== event.pointerId) return;
    gesture.current = { ...gesture.current, end: point(event) };
    setDrag(gesture.current);
  };
  const up = (event: PointerEvent<SVGSVGElement>) => {
    if (gesture.current?.pointerId !== event.pointerId) return;
    const rectangle = privacyDragRectangle(gesture.current.start, point(event));
    gesture.current = null;
    setDrag(null);
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (rectangle) onRectangle(rectangle);
  };
  const cancel = () => {
    gesture.current = null;
    setDrag(null);
  };
  return { rectangle: drag ? privacyDragRectangle(drag.start, drag.end) : null, down, move, up, cancel };
}
