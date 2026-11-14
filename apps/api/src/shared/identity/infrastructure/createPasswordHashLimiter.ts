import { PasswordHashBusyError } from '../application/PasswordHashBusyError.js';

// Ngân sách ứng viên: 1 tác vụ 64 MiB, tối đa 2 yêu cầu chờ; cần số đo SIT trước khi chốt runtime.
export const PASSWORD_HASH_LIMITS = { concurrency: 1, maxQueue: 2 } as const;

export function createPasswordHashLimiter() {
  let active = 0;
  const waiting: (() => void)[] = [];
  return async <T>(work: () => Promise<T>): Promise<T> => {
    if (active >= PASSWORD_HASH_LIMITS.concurrency) {
      if (waiting.length >= PASSWORD_HASH_LIMITS.maxQueue) {
        throw new PasswordHashBusyError();
      }
      await new Promise<void>((resolve) => waiting.push(resolve));
    } else {
      active += 1;
    }
    try {
      return await work();
    } finally {
      const next = waiting.shift();
      // Chuyển slot trực tiếp cho người chờ, không để yêu cầu mới chen vào FIFO.
      if (next) next();
      else active -= 1;
    }
  };
}
