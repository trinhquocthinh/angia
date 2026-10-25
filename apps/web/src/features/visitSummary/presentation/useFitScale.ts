import { useLayoutEffect, useRef, useState } from 'react';

// Co trang A4 (rộng cố định) cho vừa bề ngang khung trên màn hẹp, giữ đúng tỷ lệ; chiều cao khung theo trang đã co
// để không chừa khoảng trống. Không phóng to quá 100%.
export function useFitScale(pageWidth: number) {
  const frame = useRef<HTMLDivElement>(null);
  const page = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState<{ scale: number; height: number | undefined }>({
    scale: 1,
    height: undefined,
  });
  useLayoutEffect(() => {
    const frameNode = frame.current;
    const pageNode = page.current;
    if (!frameNode || !pageNode) return;
    const update = () => {
      const scale = Math.min(1, frameNode.clientWidth / pageWidth);
      setFit({ scale, height: pageNode.offsetHeight * scale });
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(frameNode);
    observer.observe(pageNode);
    return () => observer.disconnect();
  }, [pageWidth]);
  return { frame, page, ...fit };
}
