import type { AiBudgetDependencies } from '@src/features/family/application/aiBudgetPorts.js';

const notConfigured = () => Promise.reject(new Error('Ngân sách AI chưa cấu hình trong test này'));

// Sinh OpenAPI hoặc test feature khác: không được gọi hạ tầng ngân sách AI.
export function createStubAiBudgetDeps(): AiBudgetDependencies {
  return {
    repository: { read: notConfigured, inTransaction: notConfigured },
    defaultMonthlyCapUsd: 5,
    now: () => new Date(),
  };
}
