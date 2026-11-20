import { expect, it } from 'vitest';
import { purgePendingObjectsJobSchema } from './purgePendingObjectsJob.js';

it('TC-421: job dọn object nhận payload rỗng, không yêu cầu một gia đình cụ thể', () => {
  expect(purgePendingObjectsJobSchema.parse({})).toEqual({});
  for (const input of [undefined, null, [], '']) {
    expect(purgePendingObjectsJobSchema.safeParse(input).success).toBe(false);
  }
});

it('TC-806: job dọn object nhận thêm familyId tuỳ chọn (nhà đã xoá không còn dòng families để liệt kê)', () => {
  const familyId = '0198f0c2-6f6c-7a52-8c0c-5f5f5f5f5f5f';
  expect(purgePendingObjectsJobSchema.parse({ familyId })).toEqual({ familyId });
  expect(purgePendingObjectsJobSchema.safeParse({ familyId: 'khong-phai-uuid' }).success).toBe(false);
});
