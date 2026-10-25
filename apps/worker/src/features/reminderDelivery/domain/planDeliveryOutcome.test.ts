import { describe, expect, it } from 'vitest';
import { planDeliveryOutcome } from './planDeliveryOutcome.js';

const SCHEDULED = new Date('2026-10-23T00:00:00Z');
const at = (time: string) => new Date(`2026-10-23T${time}Z`);
const retry5xx = { kind: 'retry', code: 'http_5xx' } as const;

describe('planDeliveryOutcome — chính sách ghi ledger sau mỗi lần gửi (SPEC-027 §5.2)', () => {
  it('accepted ở lần đầu → accepted, attempts 1, acceptedAt = now', () => {
    const now = at('00:00:00');
    expect(planDeliveryOutcome({ kind: 'accepted' }, 0, SCHEDULED, now)).toEqual({
      status: 'accepted',
      attempts: 1,
      acceptedAt: now,
    });
  });

  it('gone (404/410) → gone, dùng mã chung http_410 và yêu cầu gỡ thiết bị', () => {
    expect(planDeliveryOutcome({ kind: 'gone' }, 0, SCHEDULED, at('00:00:00'))).toEqual({
      status: 'gone',
      attempts: 1,
      lastError: 'http_410',
      removeDevice: true,
    });
  });

  it('retry http_5xx lần đầu → pending, hẹn lại sau 1 phút', () => {
    expect(planDeliveryOutcome(retry5xx, 0, SCHEDULED, at('00:00:00'))).toEqual({
      status: 'pending',
      attempts: 1,
      nextAttemptAt: at('00:01:00'),
      lastError: 'http_5xx',
    });
  });

  it('retry khi đã gửi 4 lần → hẹn lại theo nấc backoff 16 phút', () => {
    const update = planDeliveryOutcome(retry5xx, 4, SCHEDULED, at('00:00:00'));
    expect(update).toMatchObject({ status: 'pending', attempts: 5, nextAttemptAt: at('00:16:00') });
  });

  it('retry ở lần gửi thứ 6 (đầu + 5 lần retry) → failed', () => {
    expect(planDeliveryOutcome(retry5xx, 5, SCHEDULED, at('00:00:00'))).toEqual({
      status: 'failed',
      attempts: 6,
      lastError: 'http_5xx',
    });
  });

  it('retry http_429 kèm Retry-After 300 giây → lấy max(backoff, Retry-After) = 5 phút', () => {
    const outcome = { kind: 'retry', code: 'http_429', retryAfterSeconds: 300 } as const;
    expect(planDeliveryOutcome(outcome, 0, SCHEDULED, at('00:00:00'))).toEqual({
      status: 'pending',
      attempts: 1,
      nextAttemptAt: at('00:05:00'),
      lastError: 'http_429',
    });
  });

  it('retry còn trong cửa sổ 60 phút → pending; mốc hẹn vượt cửa sổ → expired', () => {
    expect(planDeliveryOutcome(retry5xx, 3, SCHEDULED, at('00:50:00'))).toMatchObject({
      status: 'pending',
      attempts: 4,
      nextAttemptAt: at('00:58:00'),
    });
    expect(planDeliveryOutcome(retry5xx, 3, SCHEDULED, at('00:55:00'))).toEqual({
      status: 'expired',
      attempts: 4,
      lastError: 'http_5xx',
    });
  });

  it('rejected http_4xx → failed ngay, attempts 1', () => {
    const outcome = { kind: 'rejected', code: 'http_4xx' } as const;
    expect(planDeliveryOutcome(outcome, 0, SCHEDULED, at('00:00:00'))).toEqual({
      status: 'failed',
      attempts: 1,
      lastError: 'http_4xx',
    });
  });
});
