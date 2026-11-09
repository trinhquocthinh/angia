export type LoadStats = { readyMs: number; glbMs: number | null; glbBytes: number | null };

/** Spike E18-S2-T2: thời gian từ lúc mở trang tới khi mô hình sẵn sàng, cùng số liệu tải `body*.glb`. */
export function readLoadStats(): LoadStats {
  const glb = performance
    .getEntriesByType('resource')
    .find((entry) => /\/body[^/]*\.glb/.test(entry.name)) as PerformanceResourceTiming | undefined;
  return {
    readyMs: Math.round(performance.now()),
    glbMs: glb ? Math.round(glb.duration) : null,
    // transferSize = 0 khi lấy từ cache hoặc trình duyệt không báo.
    glbBytes: glb ? glb.transferSize : null,
  };
}
