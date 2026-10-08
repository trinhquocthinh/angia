import { vi } from 'vitest';
import type { PrivacyDependencies, PrivacyDocument } from './ports.js';
const full = { left: 0, top: 0, width: 1_000_000, height: 1_000_000 };
export const job = {
  documentId: 'doc',
  familyId: 'family',
  draftId: 'draft',
  edits: { rotation: 0 as const, crop: full, masks: [] },
  finalAttempt: false,
};
export function createPrivacyFixture() {
  const document = createDocument();
  const objects = new Map<string, Uint8Array>([['original', new Uint8Array([1])]]);
  let inTransaction = false;
  const current = (draftId: string) =>
    document.status === 'awaiting_privacy' &&
    document.privacyDraftId === draftId &&
    document.privacyDraftStatus === 'pending';
  const deps: PrivacyDependencies = {
    newId: () => 'attempt',
    images: {
      toPng: vi.fn(async () => {
        if (inTransaction) throw new Error('Giữ transaction lúc decode');
        return new Uint8Array([2, 3]);
      }),
    },
    storage: {
      get: vi.fn(async (key) => {
        if (inTransaction) throw new Error('Giữ transaction lúc S3');
        return objects.get(key)!;
      }),
      put: vi.fn(async (key, bytes) => {
        if (inTransaction) throw new Error('Giữ transaction lúc S3');
        objects.set(key, bytes);
      }),
      delete: vi.fn(async (key) => {
        objects.delete(key);
      }),
    },
    repository: {
      withFamily: async (family, work) => {
        inTransaction = true;
        try {
          return await work({
            findDocument: async () => (family === 'family' ? { ...document } : null),
            saveReady: async (_id, draft, key) => {
              if (!current(draft)) return false;
              document.ocrImageKey = key;
              document.privacyDraftStatus = 'ready';
              return true;
            },
            markFailed: async (_id, draft) => {
              if (!current(draft)) return false;
              document.privacyDraftStatus = 'failed';
              return true;
            },
          });
        } finally {
          inTransaction = false;
        }
      },
    },
  };
  return { deps, document, objects };
}

function createDocument(): PrivacyDocument {
  return {
    id: 'doc',
    healthProfileId: 'profile',
    status: 'awaiting_privacy',
    originalKey: 'original',
    mimeType: 'image/png',
    privacyDraftId: 'draft',
    privacyDraftStatus: 'pending',
    ocrImageKey: null,
  };
}
