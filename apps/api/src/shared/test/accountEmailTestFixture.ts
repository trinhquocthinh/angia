import { vi } from 'vitest';
import type { AccountEmailDeps } from '@src/features/account/application/ports.js';

export function emailFixture() {
  const value = { email: 'lan@example.com', emailVerified: false, pendingEmail: null };
  let count = 0;
  const emails = {
    change: vi.fn(async () => ({ ok: true as const, value })),
    requestVerification: vi.fn(async () => {
      count++;
      return { ok: true as const, sent: true };
    }),
    confirmVerification: vi.fn(async () => ({ ok: true as const })),
  };
  const deps: AccountEmailDeps = {
    emails,
    passwords: {
      findCredential: async () => ({ usernameNormalized: 'lan', passwordHash: 'hash', credentialVersion: 1 }),
      replaceIfCurrent: async () => ({ ok: true }),
    },
    hasher: {
      hash: async () => 'hash',
      verify: async (_, password) => password === 'correct',
      needsRehash: () => false,
    },
    rateLimit: {
      store: { read: async () => count, increment: async () => ++count },
      keyHasher: (kind, key) => `${kind}:${String(key)}`,
      now: () => 0,
    },
    now: () => new Date(0),
  };
  return { deps, emails, value };
}
