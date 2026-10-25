import type { ProfileDependencies } from '@src/features/profiles/application/ports.js';

// Sinh OpenAPI hoặc test feature khác: không được gọi hạ tầng hồ sơ.
export function createStubProfileDeps(): ProfileDependencies {
  const fail = () => Promise.reject(new Error('Kho hồ sơ chưa cấu hình trong test này'));
  return { repository: { withFamily: fail }, storage: { deletePrefix: fail } };
}
