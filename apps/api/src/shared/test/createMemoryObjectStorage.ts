import type { ObjectStorage } from '@src/features/documents/application/ports.js';
import type { ObjectReader } from '@src/features/documents/application/reviewPorts.js';

// S3 giả trong bộ nhớ: test route/RLS trên PostgreSQL thật; adapter S3 kiểm chứng với Garage dev/SIT.
export function createMemoryObjectStorage() {
  const objects = new Map<string, { body: Uint8Array; contentType: string }>();
  // Lần ghi thứ n kể từ khi gọi failNthPut ném lỗi (giả lập S3 hỏng giữa lô); null = không lỗi.
  let failAt: number | null = null;
  let putsSinceArm = 0;
  const failNthPut = (n: number) => {
    failAt = n;
    putsSinceArm = 0;
  };
  const storage: ObjectStorage = {
    put: async (key, stream, contentType) => {
      if (failAt !== null && ++putsSinceArm === failAt) {
        failAt = null;
        throw new Error('S3 lỗi giả lập');
      }
      objects.set(key, { body: new Uint8Array(await new Response(stream).arrayBuffer()), contentType });
    },
    delete: async (key) => {
      objects.delete(key);
    },
  };
  const reader: ObjectReader = {
    get: async (key) => {
      const object = objects.get(key);
      return object ? { body: new Blob([object.body]).stream(), contentType: object.contentType } : null;
    },
  };
  return { storage, reader, objects, failNthPut };
}
