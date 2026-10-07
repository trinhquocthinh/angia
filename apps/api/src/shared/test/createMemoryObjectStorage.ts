import type { ObjectStorage } from '@src/features/documents/application/ports.js';

// S3 giả trong bộ nhớ: test route/RLS trên PostgreSQL thật; adapter S3 kiểm chứng với Garage dev/SIT.
export function createMemoryObjectStorage() {
  const objects = new Map<string, { body: Uint8Array; contentType: string }>();
  const storage: ObjectStorage = {
    put: async (key, body, contentType) => {
      objects.set(key, { body, contentType });
    },
    delete: async (key) => {
      objects.delete(key);
    },
  };
  return { storage, objects };
}
