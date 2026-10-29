import { expect, it } from 'vitest';
import { purgePendingObjectsJobSchema } from './purgePendingObjectsJob.js';

it('TC-421: job dọn object nhận payload rỗng, không yêu cầu một gia đình cụ thể', () => {
  expect(purgePendingObjectsJobSchema.parse({})).toEqual({});
  for (const input of [undefined, null, [], '']) {
    expect(purgePendingObjectsJobSchema.safeParse(input).success).toBe(false);
  }
});
