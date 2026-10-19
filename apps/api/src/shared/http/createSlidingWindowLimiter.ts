interface LimiterOptions {
  limit: number;
  windowMs: number;
  now: () => number;
}

export type LimiterHit = { ok: true } | { ok: false; retryAfterSeconds: number };

// Rate limit cửa sổ trượt trong bộ nhớ tiến trình (F03b, SPEC-030): đúng khi API chạy 1 container, như
// giới hạn 3 lô upload; nhân bản API phải chuyển sang bộ đếm dùng chung. Lần bị chặn không ghi mốc.
export function createSlidingWindowLimiter({ limit, windowMs, now }: LimiterOptions) {
  const hits = new Map<string, number[]>();
  let lastSweep = now();
  const sweep = (at: number) => {
    for (const [key, times] of hits) {
      if ((times.at(-1) ?? 0) <= at - windowMs) hits.delete(key);
    }
    lastSweep = at;
  };
  return {
    hit(key: string): LimiterHit {
      const at = now();
      if (at - lastSweep >= windowMs) sweep(at);
      const times = (hits.get(key) ?? []).filter((time) => time > at - windowMs);
      if (times.length >= limit) {
        hits.set(key, times);
        const retryAfterSeconds = Math.max(1, Math.ceil((times[0]! + windowMs - at) / 1000));
        return { ok: false, retryAfterSeconds };
      }
      times.push(at);
      hits.set(key, times);
      return { ok: true };
    },
    size: () => hits.size,
  };
}

export type SlidingWindowLimiter = ReturnType<typeof createSlidingWindowLimiter>;
