import { PasswordHashBusyError } from '../application/PasswordHashBusyError.js';
import { PASSWORD_HASH_LIMITS } from './passwordHashLimits.js';

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
