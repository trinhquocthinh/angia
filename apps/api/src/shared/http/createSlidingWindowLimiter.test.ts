import { describe, expect, it } from 'vitest';
import { createSlidingWindowLimiter } from './createSlidingWindowLimiter.js';

function setup() {
  const clock = { t: 0 };
  const limiter = createSlidingWindowLimiter({ limit: 10, windowMs: 60_000, now: () => clock.t });
  return { clock, limiter };
}

describe('TC-294 — rate limit cửa sổ trượt theo tài khoản và thao tác (SPEC-030)', () => {
  it('10 lần trong 60 s qua, lần 11 bị chặn kèm số giây chờ', () => {
    const { limiter } = setup();
    for (let i = 0; i < 10; i += 1) expect(limiter.hit('a:upload')).toEqual({ ok: true });
    expect(limiter.hit('a:upload')).toEqual({ ok: false, retryAfterSeconds: 60 });
  });

  it('số giây chờ giảm theo thời gian và lần bị chặn không chiếm chỗ', () => {
    const { clock, limiter } = setup();
    for (let i = 0; i < 10; i += 1) limiter.hit('a:upload');
    clock.t = 30_000;
    expect(limiter.hit('a:upload')).toEqual({ ok: false, retryAfterSeconds: 30 });
    clock.t = 60_001;
    expect(limiter.hit('a:upload')).toEqual({ ok: true });
  });

  it('tài khoản khác và thao tác khác có bộ đếm riêng', () => {
    const { limiter } = setup();
    for (let i = 0; i < 10; i += 1) limiter.hit('a:upload');
    expect(limiter.hit('b:upload')).toEqual({ ok: true });
    expect(limiter.hit('a:privacy-draft')).toEqual({ ok: true });
  });

  it('dọn khóa đã hết hạn để không rò bộ nhớ', () => {
    const { clock, limiter } = setup();
    limiter.hit('a:upload');
    limiter.hit('b:upload');
    clock.t = 120_001;
    limiter.hit('c:upload');
    expect(limiter.size()).toBe(1);
  });
});
