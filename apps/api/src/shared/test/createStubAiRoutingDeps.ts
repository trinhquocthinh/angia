import type { AiRoutingDependencies } from '@src/features/aiRouting/application/ports.js';

// Chỉ dựng route/OpenAPI, không để feature khác vô tình dùng kho cấu hình giả.
export function createStubAiRoutingDeps(): AiRoutingDependencies {
  return {
    repository: {
      read: () => Promise.reject(new Error('Cấu hình OCR chưa được nối trong test này')),
      compareAndSet: () => Promise.reject(new Error('Cấu hình OCR chưa được nối trong test này')),
    },
    now: () => new Date(),
  };
}
