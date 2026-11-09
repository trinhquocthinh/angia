/** Spike E18-S2-T2: FPS trung bình và khung chậm nhất (ms) từ dấu thời gian `requestAnimationFrame`. */
export function fpsFromFrameTimes(times: readonly number[]): { fps: number; worstMs: number } | null {
  if (times.length < 2) return null;
  let worstMs = 0;
  for (let i = 1; i < times.length; i += 1) worstMs = Math.max(worstMs, times[i]! - times[i - 1]!);
  const spanMs = times[times.length - 1]! - times[0]!;
  return { fps: Math.round(((times.length - 1) * 1000) / spanMs), worstMs: Math.round(worstMs) };
}
