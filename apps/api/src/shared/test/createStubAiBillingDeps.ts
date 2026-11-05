import type { AiBillingDependencies } from '@src/features/aiBilling/application/ports.js';

export function createStubAiBillingDeps(): AiBillingDependencies {
  return {
    repository: { readMonth: () => Promise.resolve({ confirmedSpendUsd: '0.000000000000', sources: [] }) },
    now: () => new Date(),
  };
}
