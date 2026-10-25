import { describe, expect, it } from 'vitest';
import { purgeProfileObjects } from './purgeProfileObjects.js';
import type { PurgeDependencies } from './ports.js';

const familyId = '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5c';
const profileId = '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5d';
const prefix = `families/${familyId}/profiles/${profileId}/`;
const otherProfile = `families/${familyId}/profiles/0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5e/documents/x/original.jpg`;

function setup(exists: boolean, failDelete = false) {
  const objects = new Set([
    `${prefix}documents/a/original.jpg`,
    `${prefix}documents/a/previews/b.webp`,
    otherProfile,
  ]);
  const listed: string[] = [];
  const deps: PurgeDependencies = {
    repository: { profileExists: async () => exists },
    storage: {
      async *list(value) {
        listed.push(value);
        for (const key of [...objects]) if (key.startsWith(value)) yield { key };
      },
      delete: async (key) => {
        if (failDelete) throw new Error('S3 lỗi giả lập');
        objects.delete(key);
      },
    },
  };
  return { deps, objects, listed };
}

describe('Job vét ảnh hồ sơ đã xóa (BR-010)', () => {
  it('TC-368: hồ sơ còn tồn tại → bỏ qua, không liệt kê hay xóa gì', async () => {
    const { deps, objects, listed } = setup(true);
    expect(await purgeProfileObjects(deps, { familyId, profileId })).toEqual({
      outcome: 'skipped',
      removed: 0,
    });
    expect(listed).toEqual([]);
    expect(objects.size).toBe(3);
  });
  it('TC-368: hồ sơ đã xóa → xóa mọi khóa dưới tiền tố, giữ hồ sơ khác', async () => {
    const { deps, objects, listed } = setup(false);
    expect(await purgeProfileObjects(deps, { familyId, profileId })).toEqual({
      outcome: 'purged',
      removed: 2,
    });
    expect(listed).toEqual([prefix]);
    expect([...objects]).toEqual([otherProfile]);
  });
  it('TC-368: lỗi S3 → ném để pg-boss thử lại', async () => {
    const { deps } = setup(false, true);
    await expect(purgeProfileObjects(deps, { familyId, profileId })).rejects.toThrow('S3 lỗi giả lập');
  });
});
