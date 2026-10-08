import { describe, expect, it } from 'vitest';
import { createConcurrencyLimit } from './createConcurrencyLimit.js';

describe('Giới hạn số lô tải lên xử lý đồng thời (E3-S1-T1)', () => {
  it('cấp tối đa 3 chỗ, chỗ thứ 4 bị từ chối ngay, trả chỗ thì cấp lại được', () => {
    const limit = createConcurrencyLimit(3);
    const releases = [limit.tryAcquire(), limit.tryAcquire(), limit.tryAcquire()];
    expect(releases.every((release) => typeof release === 'function')).toBe(true);
    expect(limit.tryAcquire()).toBeNull();
    releases[0]!();
    expect(limit.tryAcquire()).not.toBeNull();
    expect(limit.tryAcquire()).toBeNull();
  });

  it('trả cùng một chỗ hai lần không làm dư chỗ', () => {
    const limit = createConcurrencyLimit(1);
    const release = limit.tryAcquire()!;
    release();
    release();
    expect(limit.tryAcquire()).not.toBeNull();
    expect(limit.tryAcquire()).toBeNull();
  });
});
