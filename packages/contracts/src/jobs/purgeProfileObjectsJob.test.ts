import { describe, expect, it } from 'vitest';
import { profileObjectPrefix, purgeProfileObjectsJobSchema } from './purgeProfileObjectsJob.js';

const familyId = '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5c';
const profileId = '0199b5a4-1c2d-7e3f-8a9b-0c1d2e3f4a5d';

describe('Job purge-profile-objects (BR-010)', () => {
  it('tiền tố hồ sơ kết thúc bằng dấu / để không trùng hồ sơ khác', () => {
    expect(profileObjectPrefix(familyId, profileId)).toBe(`families/${familyId}/profiles/${profileId}/`);
  });
  it('nhận đúng cặp familyId + profileId dạng UUID', () => {
    expect(purgeProfileObjectsJobSchema.parse({ familyId, profileId })).toEqual({ familyId, profileId });
  });
  it('từ chối payload thiếu trường hoặc ID không phải UUID', () => {
    expect(purgeProfileObjectsJobSchema.safeParse({ familyId }).success).toBe(false);
    expect(purgeProfileObjectsJobSchema.safeParse({ familyId, profileId: 'abc' }).success).toBe(false);
  });
});
