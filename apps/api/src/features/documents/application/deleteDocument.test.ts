import { describe, expect, it } from 'vitest';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import { deleteDocument } from './deleteDocument.js';
import type { DeletionStore, DocumentDeletionDeps } from './deletionPorts.js';

const familyId = '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5c';
const documentId = '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5d';
const key = `families/${familyId}/profiles/p/documents/${documentId}/upload.jpg`;

interface Options {
  exists?: boolean;
  imageKey?: string | null;
  consent?: ConsentStatus;
  storageFails?: boolean;
}

// Ghi thứ tự gọi; "commit" được ghi khi work của withFamily hoàn tất (transaction COMMIT).
function setup(options: Options = {}) {
  const events: string[] = [];
  const purges = new Set<string>();
  const warnings: { obj: object; msg: string }[] = [];
  const store: DeletionStore = {
    findDocument: async (_id, lock) => {
      events.push(lock ? 'lock' : 'find');
      if (options.exists === false) return null;
      const imageKey = options.imageKey === undefined ? key : options.imageKey;
      return { imageKey, profileConsentStatus: options.consent ?? 'confirmed' };
    },
    deleteDocument: async () => void events.push('delete'),
    insertObjectPurge: async (value) => {
      events.push(`purge+:${value}`);
      purges.add(value);
    },
    removeObjectPurge: async (value) => {
      events.push(`purge-:${value}`);
      purges.delete(value);
    },
    countImpact: async () => {
      throw new Error('Không được đếm khi xóa');
    },
  };
  const deps: DocumentDeletionDeps = {
    repository: {
      withFamily: async (_familyId, work) => {
        const result = await work(store);
        events.push('commit');
        return result;
      },
    },
    storage: {
      delete: async (value) => {
        events.push(`s3:${value}`);
        if (options.storageFails) throw new Error('S3 lỗi giả lập');
      },
    },
    purgeQueue: { enqueue: async () => void events.push('enqueue') },
    logger: { warn: (obj, msg) => void warnings.push({ obj, msg }) },
  };
  return { deps, events, purges, warnings };
}

describe('Xóa chứng từ (SPEC-037, BR-048)', () => {
  it('TC-411: khóa → ghi purge → xóa → COMMIT, rồi xóa S3 và gỡ purge trong transaction mới', async () => {
    const { deps, events, purges } = setup();
    expect(await deleteDocument(deps, familyId, documentId)).toEqual({ ok: true });
    expect(events).toEqual([
      'lock',
      `purge+:${key}`,
      'delete',
      'commit',
      `s3:${key}`,
      `purge-:${key}`,
      'commit',
    ]);
    expect(purges.size).toBe(0);
  });

  it('TC-410: S3 lỗi sau COMMIT → vẫn ok, enqueue purge-pending-objects, dòng object_purges còn', async () => {
    const { deps, events, purges, warnings } = setup({ storageFails: true });
    expect(await deleteDocument(deps, familyId, documentId)).toEqual({ ok: true });
    expect(events).toContain('enqueue');
    expect(purges).toEqual(new Set([key]));
    expect(warnings).toHaveLength(1);
    expect(Object.keys(warnings[0]!.obj).sort()).toEqual(['documentId', 'familyId', 'reason']);
    expect(JSON.stringify(warnings)).not.toContain(key);
  });

  it('TC-410: ảnh NULL → vẫn xóa, không ghi purge, không gọi S3', async () => {
    const { deps, events } = setup({ imageKey: null });
    expect(await deleteDocument(deps, familyId, documentId)).toEqual({ ok: true });
    expect(events).toEqual(['lock', 'delete', 'commit']);
  });

  it('TC-413: không thấy chứng từ → ERR_NOT_FOUND; hồ sơ rút đồng thuận → ERR_CONSENT_REQUIRED, không xóa gì', async () => {
    const missing = setup({ exists: false });
    expect(await deleteDocument(missing.deps, familyId, documentId)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(missing.events).toEqual(['lock', 'commit']);
    const withdrawn = setup({ consent: 'withdrawn' });
    expect(await deleteDocument(withdrawn.deps, familyId, documentId)).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
    expect(withdrawn.events).toEqual(['lock', 'commit']);
  });
});
