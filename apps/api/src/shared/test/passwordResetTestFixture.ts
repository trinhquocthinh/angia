import { vi } from 'vitest';
import type { EmailPasswordResetDeps } from '@src/features/account/application/passwordResetPorts.js';

export function passwordResetFixture() {
  const counts = new Map<string, number>();
  const tasks: (() => Promise<void>)[] = [];
  const resets = {
    request: vi.fn(async () => {}),
    findValid: vi.fn<EmailPasswordResetDeps['emailPasswordResets']['findValid']>(async () => ({
      accountId: 'account',
      usernameNormalized: 'lan',
    })),
    consume: vi.fn(async () => true),
  };
  const deps: EmailPasswordResetDeps & { runInBackground: (task: () => Promise<void>) => void } = {
    emailPasswordResets: resets,
    hasher: { hash: vi.fn(async () => 'new-hash'), verify: async () => true, needsRehash: () => false },
    rateLimit: {
      store: {
        read: async (key) => counts.get(key) ?? 0,
        increment: async (key) => {
          const count = (counts.get(key) ?? 0) + 1;
          counts.set(key, count);
          return count;
        },
      },
      keyHasher: (kind, key) => `${kind}:${String(key)}`,
      now: () => 0,
    },
    now: () => new Date(0),
    runInBackground: (task) => {
      tasks.push(task);
    },
  };
  return { deps, resets, counts, tasks };
}
