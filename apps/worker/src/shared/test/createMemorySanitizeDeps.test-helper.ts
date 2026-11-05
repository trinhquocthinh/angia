import { vi } from 'vitest';
import type {
  SanitizeDependencies,
  SanitizeDocument,
  SanitizeStore,
} from '../../features/documentSanitize/application/ports.js';

export function createMemorySanitizeDeps(approved = true) {
  const oldKey = 'families/family/profiles/profile/documents/doc/upload.jpg';
  let document: SanitizeDocument | null = {
    id: 'doc',
    healthProfileId: 'profile',
    status: 'uploaded',
    imageKey: oldKey,
    privacyApprovedBy: approved ? 'account' : null,
  };
  const purges = new Set<string>();
  const objects = new Map<string, Uint8Array>([[oldKey, new Uint8Array([1])]]);
  const store: SanitizeStore = {
    findDocument: vi.fn(async () => document && { ...document }),
    saveSanitized: vi.fn(async (_id, change) => {
      if (document?.status !== 'uploaded' || document.imageKey !== change.oldKey) return null;
      Object.assign(document, {
        imageKey: change.key,
        status: document.privacyApprovedBy ? 'extracting' : 'manual_entry',
      });
      purges.add(change.oldKey);
      return document.status as 'extracting' | 'manual_entry';
    }),
    markUnusable: vi.fn(async (_id, key) => {
      if (document?.status !== 'uploaded' || document.imageKey !== key) return false;
      document.imageKey = null;
      document.status = 'manual_entry';
      purges.add(key);
      return true;
    }),
    recordPurge: vi.fn(async (key) => void purges.add(key)),
  };
  const emptyStore = { ...store, findDocument: async () => null };
  const deps: SanitizeDependencies = {
    newId: () => 'attempt',
    images: { sanitize: vi.fn(async () => ({ bytes: new Uint8Array([2]), sha256: 'a'.repeat(64) })) },
    repository: {
      withFamily: async (family, work) => work(family === 'family' ? store : emptyStore),
    },
    storage: {
      get: vi.fn(async (key) => objects.get(key)!),
      put: vi.fn(async (key, bytes) => void objects.set(key, bytes)),
      delete: vi.fn(async (key) => void objects.delete(key)),
    },
  };
  return {
    deps,
    store,
    objects,
    purges,
    oldKey,
    document: () => document,
    removeDocument: () => {
      document = null;
    },
  };
}
