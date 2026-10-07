import type { DocumentDependencies } from '@src/features/documents/application/ports.js';

const notConfigured = () => Promise.reject(new Error('Kho chứng từ chưa cấu hình trong test này'));

// Sinh OpenAPI hoặc test feature khác: không được gọi hạ tầng chứng từ.
export function createStubDocumentDeps(): DocumentDependencies {
  return {
    repository: { withFamily: notConfigured },
    storage: { put: notConfigured, delete: notConfigured },
    newId: () => 'stub',
  };
}
