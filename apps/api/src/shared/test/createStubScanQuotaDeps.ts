import type { ScanQuotaDependencies } from '@src/features/scanQuota/application/ports.js';
const unavailable = () => Promise.reject(new Error('Kho quota quét chưa cấu hình trong test này'));
export function createStubScanQuotaDeps(): ScanQuotaDependencies {
  return {
    repository: {
      readAdmin: unavailable,
      readFamily: unavailable,
      grant: unavailable,
    },
    now: () => new Date(),
    defaultMonthlyCapUsd: 5,
  };
}
