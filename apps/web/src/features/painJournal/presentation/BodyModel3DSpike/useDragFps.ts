import { useEffect, useRef, useState } from 'react';
import { fpsFromFrameTimes } from '../../application/fpsFromFrameTimes';

// Lượt kéo ngắn hơn chừng này khung hình là chạm chọn vùng, không đủ để đo FPS.
const MIN_FRAMES = 30;

/**
 * Spike E18-S2-T2: đếm khung `requestAnimationFrame` trong lúc giữ ngón tay xoay mô hình.
 * shortcut: đo nhịp rAF chứ không đếm lần vẽ của WebGL; đủ cho spike, E22 cần thì đo bằng `useFrame`.
 */
export function useDragFps() {
  const [result, setResult] = useState<ReturnType<typeof fpsFromFrameTimes>>(null);
  const frames = useRef<number[]>([]);
  const raf = useRef(0);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const tick = (time: number) => {
    frames.current.push(time);
    raf.current = requestAnimationFrame(tick);
  };
  const start = () => {
    cancelAnimationFrame(raf.current);
    frames.current = [];
    raf.current = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf.current);
    if (frames.current.length >= MIN_FRAMES) setResult(fpsFromFrameTimes(frames.current));
  };

  return { result, handlers: { onPointerDown: start, onPointerUp: stop, onPointerCancel: stop } };
}
