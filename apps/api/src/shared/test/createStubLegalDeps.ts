import type { LegalRepository } from '@src/features/legal/application/ports.js';

// Unit test mặc định đã đồng ý; truyền false để kiểm gate, không tắt middleware.
export function createStubLegalDeps(accepted = true): LegalRepository {
  return {
    status: async () => ({ accepted, missingDocuments: false }),
    current: async () => {
      throw new Error('Văn bản legal chưa cấu hình trong test này');
    },
    accept: async () => {
      throw new Error('Ghi đồng ý chưa cấu hình trong test này');
    },
  };
}
