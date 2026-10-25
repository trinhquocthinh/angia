import { useEffect, useRef, type RefObject } from 'react';
import type { ZoomTo } from './useImageViewport';

type Point = { x: number; y: number };
type Latest = { current: { scale: number; zoomTo: ZoomTo } };
const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.y - b.y);

function bindGestures(element: HTMLElement, latest: Latest) {
  const pointers = new Map<number, Point>();
  let pinch: { distance: number; scale: number } | null = null;
  let drag: Point | null = null;
  const local = (event: { clientX: number; clientY: number }): Point => {
    const rect = element.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  };
  const onWheel = (event: WheelEvent) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    latest.current.zoomTo(latest.current.scale * Math.exp(-event.deltaY * 0.01), local(event));
  };
  const onDown = (event: PointerEvent) => {
    pointers.set(event.pointerId, local(event));
    if (event.pointerType === 'mouse' && event.button === 0) {
      drag = local(event);
      element.setPointerCapture(event.pointerId);
    }
    const [a, b] = [...pointers.values()];
    if (pointers.size === 2 && a && b) pinch = { distance: distance(a, b), scale: latest.current.scale };
  };
  const onMove = (event: PointerEvent) => {
    if (!pointers.has(event.pointerId)) return;
    const point = local(event);
    pointers.set(event.pointerId, point);
    const [a, b] = [...pointers.values()];
    if (pinch && a && b) {
      const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      latest.current.zoomTo((pinch.scale * distance(a, b)) / pinch.distance, mid);
    } else if (drag) {
      element.scrollBy(drag.x - point.x, drag.y - point.y);
      drag = point;
    }
  };
  const onUp = (event: PointerEvent) => {
    pointers.delete(event.pointerId);
    if (pointers.size < 2) pinch = null;
    if (event.pointerType === 'mouse') drag = null;
  };
  const listeners = [
    ['wheel', onWheel],
    ['pointerdown', onDown],
    ['pointermove', onMove],
    ['pointerup', onUp],
    ['pointercancel', onUp],
  ] as const;
  for (const [type, listener] of listeners)
    element.addEventListener(type, listener as EventListener, { passive: type !== 'wheel' });
  return () => {
    for (const [type, listener] of listeners) element.removeEventListener(type, listener as EventListener);
  };
}

// Cử chỉ khung xem ảnh: Ctrl/⌘ + cuộn (kể cả chụm trackpad) để phóng, chụm 2 ngón trên cảm ứng,
// kéo chuột để di ảnh. Cuộn thường và vuốt 1 ngón giữ hành vi cuộn gốc của trình duyệt.
export function useViewportGestures(
  containerRef: RefObject<HTMLDivElement | null>,
  scale: number,
  zoomTo: ZoomTo,
) {
  const latest = useRef({ scale, zoomTo });
  useEffect(() => {
    latest.current = { scale, zoomTo };
  }, [scale, zoomTo]);
  useEffect(() => {
    const element = containerRef.current;
    return element ? bindGestures(element, latest) : undefined;
  }, [containerRef]);
}
