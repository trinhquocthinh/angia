import { describe, expect, it } from 'vitest';
import { shouldSlideSession } from './shouldSlideSession.js';

const NOW = new Date('2026-10-05T03:00:00.000Z');

describe('shouldSlideSession', () => {
  it('phiên vừa tạo (còn đủ 30 ngày) thì không gia hạn để tránh ghi DB mỗi request', () => {
    expect(shouldSlideSession(new Date('2026-11-04T03:00:00.000Z'), NOW)).toBe(false);
  });

  it('phiên đã dùng chưa tới 1 ngày thì chưa gia hạn', () => {
    expect(shouldSlideSession(new Date('2026-11-03T03:00:00.001Z'), NOW)).toBe(false);
  });

  it('phiên đã trôi đủ 1 ngày thì gia hạn lại 30 ngày kể từ lúc dùng', () => {
    expect(shouldSlideSession(new Date('2026-11-03T03:00:00.000Z'), NOW)).toBe(true);
  });

  it('phiên sắp hết hạn thì gia hạn', () => {
    expect(shouldSlideSession(new Date('2026-10-05T04:00:00.000Z'), NOW)).toBe(true);
  });
});
