import { describe, expect, it } from 'vitest';
import { isWithinSendWindow, remainingTtlSeconds } from './sendWindow.js';

const SCHEDULED = new Date('2026-10-23T00:00:00Z');
const at = (time: string) => new Date(`2026-10-23T${time}Z`);

describe('sendWindow — cửa sổ gửi 60 phút sau giờ hẹn', () => {
  it('01:00:00 còn trong cửa sổ, 01:00:01 đã ra ngoài', () => {
    expect(isWithinSendWindow(SCHEDULED, at('01:00:00'))).toBe(true);
    expect(isWithinSendWindow(SCHEDULED, at('01:00:01'))).toBe(false);
  });

  it('TTL bằng số giây còn lại của cửa sổ, tối thiểu 60 giây', () => {
    expect(remainingTtlSeconds(SCHEDULED, at('00:00:00'))).toBe(3600);
    expect(remainingTtlSeconds(SCHEDULED, at('00:59:30'))).toBe(60);
  });
});
