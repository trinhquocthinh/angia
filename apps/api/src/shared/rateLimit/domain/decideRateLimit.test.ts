import { describe, expect, it } from 'vitest';
import { decideRateLimit } from './decideRateLimit.js';
import { rateLimitPolicies } from './rateLimitPolicies.js';

describe('Quyết định cửa sổ cố định SPEC-078', () => {
  it.each([
    [4, false],
    [5, false],
    [6, true],
  ])('TC-846: consume số đếm %s chặn %s', (count, blocked) => {
    expect(decideRateLimit(rateLimitPolicies.register, 3_600_001, count, 'consume')).toEqual({
      windowStart: 3_600_000,
      blocked,
      retryAfterSeconds: 3600,
    });
  });
  it('TC-845: check chặn đúng ngưỡng và Retry-After ít nhất một giây', () => {
    expect(decideRateLimit(rateLimitPolicies.login_failed, 899_999, 10, 'check')).toEqual({
      windowStart: 0,
      blocked: true,
      retryAfterSeconds: 1,
    });
    expect(decideRateLimit(rateLimitPolicies.login_failed, 900_000, 9, 'check')).toEqual({
      windowStart: 900_000,
      blocked: false,
      retryAfterSeconds: 900,
    });
  });
});
