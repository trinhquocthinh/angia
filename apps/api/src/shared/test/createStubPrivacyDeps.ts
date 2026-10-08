import type { PrivacyDependencies } from '@src/features/documentPrivacy/application/ports.js';
const notConfigured = () =>
  Promise.reject(new Error('Kho ảnh bảo vệ định danh chưa cấu hình trong test này'));
export function createStubPrivacyDeps(): PrivacyDependencies {
  return {
    repository: { withFamily: notConfigured },
    reader: { get: notConfigured },
    queue: { state: notConfigured },
    hashPng: notConfigured,
    newId: () => 'stub',
    now: () => new Date(),
  };
}
