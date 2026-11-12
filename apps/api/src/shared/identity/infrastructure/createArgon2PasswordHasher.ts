import { randomBytes } from 'node:crypto';
import { argon2id, hash, needsRehash, verify } from 'argon2';
import type { PasswordHasher } from '../application/ports.js';
import { createPasswordHashLimiter } from './createPasswordHashLimiter.js';

const runHash = createPasswordHashLimiter();

const options = {
  type: argon2id,
  version: 0x13,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  hashLength: 32,
} as const;

// Chia sẻ ngân sách giữa mọi instance trong cùng tiến trình, kể cả dummy hash.
export function createArgon2PasswordHasher(): PasswordHasher {
  return {
    hash: (password) => runHash(() => hash(password, { ...options, salt: randomBytes(16) })),
    verify: (digest, password) => runHash(() => verify(digest, password)),
    needsRehash: (digest) => needsRehash(digest, options),
  };
}
