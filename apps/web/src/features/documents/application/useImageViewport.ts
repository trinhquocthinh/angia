import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { clampScale, fitScale, imageBox, zoomAt } from './imageViewport';

type Size = { width: number; height: number };
export type ViewMode = 'fit' | 'width' | 'custom';
export type ZoomTo = (scale: number, point?: { x: number; y: number }) => void;

// Trạng thái khung xem ảnh: "Vừa khung" / "Vừa ngang" bám theo kích thước khung; phóng tay giữ điểm neo.
export function useImageViewport(turns: number) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [container, setContainer] = useState<Size | null>(null);
  const [natural, setNatural] = useState<Size | null>(null);
  const [view, setView] = useState<{ mode: ViewMode; scale: number }>({ mode: 'width', scale: 1 });
  const pendingScroll = useRef<{ left: number; top: number } | null>(null);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;
    const measure = () => setContainer({ width: element.clientWidth, height: element.clientHeight });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const fit = container && natural ? fitScale(container, natural, turns) : 1;
  const scale = view.mode === 'fit' ? fit : view.mode === 'width' ? 1 : clampScale(view.scale, fit);

  const zoomTo = useCallback<ZoomTo>(
    (next, point) => {
      const element = containerRef.current;
      if (!element) return;
      const target = clampScale(next, fit);
      const anchor = point ?? { x: element.clientWidth / 2, y: element.clientHeight / 2 };
      pendingScroll.current = zoomAt(
        { left: element.scrollLeft, top: element.scrollTop },
        anchor,
        scale,
        target,
      );
      setView({ mode: 'custom', scale: target });
    },
    [fit, scale],
  );

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element || !pendingScroll.current) return;
    element.scrollTo(pendingScroll.current);
    pendingScroll.current = null;
  }, [scale]);

  return {
    containerRef,
    box: container && natural ? imageBox(container.width, scale, natural, turns) : null,
    container,
    scale,
    mode: view.mode,
    onLoad: (image: HTMLImageElement) =>
      setNatural({ width: image.naturalWidth, height: image.naturalHeight }),
    fitPage: () => setView({ mode: 'fit', scale }),
    fitWidth: () => setView({ mode: 'width', scale }),
    zoomTo,
  };
}
