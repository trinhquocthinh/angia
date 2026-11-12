import { randomBytes } from 'node:crypto';
import { argon2id, hash, needsRehash, verify } from 'argon2';
import type { PasswordHasher } from '../application/ports.js';

const options = {
  type: argon2id,
  version: 0x13,
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 1,
  hashLength: 32,
} as const;

// Chưa nối runtime; giới hạn đồng thời/hàng đợi theo benchmark E26-S2-T3.
export function createArgon2PasswordHasher(): PasswordHasher {
  return {
    hash: (password) => hash(password, { ...options, salt: randomBytes(16) }),
    verify: (digest, password) => verify(digest, password),
    needsRehash: (digest) => needsRehash(digest, options),
  };
}
