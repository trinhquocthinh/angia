import { expect, it, vi } from 'vitest';
import { createArgon2PasswordHasher } from './createArgon2PasswordHasher.js';

const native = vi.hoisted(() => ({ hash: vi.fn(), verify: vi.fn() }));
vi.mock('argon2', () => ({ ...native, argon2id: 2, needsRehash: vi.fn() }));

it('TC-905 hash và verify chia sẻ giới hạn trên nhiều instance adapter', async () => {
  let release!: (value: string) => void;
  native.hash.mockImplementationOnce(
    () =>
      new Promise<string>((resolve) => {
        release = resolve;
      }),
  );
  native.hash.mockResolvedValue('next_hash');
  native.verify.mockResolvedValue(true);
  const first = createArgon2PasswordHasher();
  const second = createArgon2PasswordHasher();
  const active = first.hash('first_password');
  const queuedVerify = second.verify('digest', 'password');
  const queuedHash = second.hash('second_password');
  await expect(first.verify('digest', 'overflow')).rejects.toThrow('ERR_PASSWORD_HASH_BUSY');
  expect(native.verify).not.toHaveBeenCalled();
  expect(native.hash).toHaveBeenCalledTimes(1);
  release('first_hash');
  expect(await Promise.all([active, queuedVerify, queuedHash])).toEqual(['first_hash', true, 'next_hash']);
  expect(native.verify).toHaveBeenCalledExactlyOnceWith('digest', 'password');
});
