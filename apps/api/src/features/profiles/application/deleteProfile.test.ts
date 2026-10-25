import { describe, expect, it } from 'vitest';
import type { PurgeProfileObjectsJob } from '@angia/contracts';
import { deleteProfile } from './deleteProfile.js';
import type { ProfileDeletionDeps, ProfileRepository, ProfileStore } from './ports.js';

const familyId = '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5c';
const profileId = '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5d';
const prefix = `families/${familyId}/profiles/${profileId}/`;

// Ghi thứ tự gọi; "commit" được ghi khi work của withFamily hoàn tất (transaction COMMIT).
function setup(options: { exists?: boolean; storageFails?: boolean } = {}) {
  const events: string[] = [];
  const jobs: PurgeProfileObjectsJob[] = [];
  const warnings: { obj: object; msg: string }[] = [];
  const store = {
    lockProfile: async (id: string) => {
      events.push('lock');
      return options.exists === false || id !== profileId ? null : { id, displayName: 'Mẹ' };
    },
    deleteProfile: async () => void events.push('delete'),
    enqueuePurge: async (job: PurgeProfileObjectsJob) => {
      events.push('enqueue');
      jobs.push(job);
    },
  } as unknown as ProfileStore;
  const repository: ProfileRepository = {
    withFamily: async (_familyId, work) => {
      const result = await work(store);
      events.push('commit');
      return result;
    },
  };
  const deps: ProfileDeletionDeps = {
    repository,
    storage: {
      deletePrefix: async (value) => {
        events.push(`deletePrefix:${value}`);
        if (options.storageFails) throw new Error('S3 lỗi giả lập');
        return 3;
      },
    },
    logger: { warn: (obj, msg) => void warnings.push({ obj, msg }) },
  };
  return { deps, events, jobs, warnings };
}

describe('Xóa triệt để hồ sơ (SPEC-007, BR-010)', () => {
  it('TC-366: tên khớp → xóa DB, enqueue job vét, COMMIT rồi mới xóa tiền tố S3', async () => {
    const { deps, events, jobs } = setup();
    expect(await deleteProfile(deps, familyId, profileId, 'Mẹ')).toEqual({ ok: true, value: undefined });
    expect(events).toEqual(['lock', 'delete', 'enqueue', 'commit', `deletePrefix:${prefix}`]);
    expect(jobs).toEqual([{ familyId, profileId }]);
  });
  it('TC-366: tên không khớp → ERR_CONFIRMATION_MISMATCH, không xóa gì', async () => {
    const { deps, events, jobs } = setup();
    expect(await deleteProfile(deps, familyId, profileId, 'me')).toEqual({
      ok: false,
      code: 'ERR_CONFIRMATION_MISMATCH',
    });
    expect(events).toEqual(['lock', 'commit']);
    expect(jobs).toEqual([]);
  });
  it('TC-366: không thấy hồ sơ trong gia đình → ERR_NOT_FOUND, không xóa gì', async () => {
    const { deps, events } = setup({ exists: false });
    expect(await deleteProfile(deps, familyId, profileId, 'Mẹ')).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(events).toEqual(['lock', 'commit']);
  });
  it('TC-366: S3 lỗi sau COMMIT → vẫn thành công, cảnh báo chỉ chứa uuid', async () => {
    const { deps, warnings } = setup({ storageFails: true });
    expect(await deleteProfile(deps, familyId, profileId, 'Mẹ')).toEqual({ ok: true, value: undefined });
    expect(warnings).toHaveLength(1);
    expect(Object.keys(warnings[0]!.obj).sort()).toEqual(['familyId', 'profileId', 'reason']);
    expect(JSON.stringify(warnings)).not.toContain('Mẹ');
  });
});
