import type { PushDependencies } from '@src/features/pushSubscriptions/application/ports.js';
export function createStubPushDeps(): PushDependencies {
  return {
    publicKey: null,
    now: () => new Date(),
    sender: { send: async () => 'failed' },
    repository: { read: async () => null, save: async () => 'expired', remove: async () => undefined },
  };
}
