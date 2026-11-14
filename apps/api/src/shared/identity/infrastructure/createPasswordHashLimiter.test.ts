import { PasswordHashBusyError } from '../application/PasswordHashBusyError.js';
import { describe, expect, it, vi } from 'vitest';
import { createPasswordHashLimiter } from './createPasswordHashLimiter.js';

describe('Giới hạn tài nguyên băm mật khẩu', () => {
  it('TC-905 chỉ chạy một tác vụ, chờ hai FIFO và từ chối tác vụ thứ tư', async () => {
    const run = createPasswordHashLimiter();
    const order: number[] = [];
    let release!: () => void;
    const first = run(async () => {
      order.push(1);
      await new Promise<void>((resolve) => {
        release = resolve;
      });
      return 1;
    });
    const second = run(async () => {
      order.push(2);
      return 2;
    });
    const third = run(async () => {
      order.push(3);
      return 3;
    });
    const overflow = vi.fn(async () => 4);
    await expect(run(overflow)).rejects.toBeInstanceOf(PasswordHashBusyError);
    expect(overflow).not.toHaveBeenCalled();
    expect(order).toEqual([1]);
    release();
    expect(await Promise.all([first, second, third])).toEqual([1, 2, 3]);
    expect(order).toEqual([1, 2, 3]);
    await expect(run(async () => 5)).resolves.toBe(5);
  });

  it('TC-905 trả slot sau lỗi async và lỗi đồng bộ, không nuốt lỗi gốc', async () => {
    const run = createPasswordHashLimiter();
    const failure = new Error('native_failure');
    let reject!: (error: Error) => void;
    const first = run(
      () =>
        new Promise<void>((_resolve, fail) => {
          reject = fail;
        }),
    );
    const second = run(() => {
      throw failure;
    });
    const third = run(async () => true);
    const firstCheck = expect(first).rejects.toBe(failure);
    const secondCheck = expect(second).rejects.toBe(failure);
    reject(failure);
    await Promise.all([firstCheck, secondCheck]);
    await expect(third).resolves.toBe(true);
    await expect(run(async () => true)).resolves.toBe(true);
  });
});
