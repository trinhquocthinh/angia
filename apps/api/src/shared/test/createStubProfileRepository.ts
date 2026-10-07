import type { ProfileRepository } from '@src/features/profiles/application/ports.js';

// Sinh OpenAPI hoặc test feature khác: không được gọi hạ tầng hồ sơ.
export function createStubProfileRepository(): ProfileRepository {
  return { withFamily: () => Promise.reject(new Error('Kho hồ sơ chưa cấu hình trong test này')) };
}
