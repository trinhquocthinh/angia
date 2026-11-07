import { expect, it } from 'vitest';
import * as schemas from './schemas.js';
it('TC-694: PATCH chấp nhận null để xóa ngày kết thúc, POST vẫn từ chối null', () => {
  expect(schemas.updateExerciseNoteRequestSchema.safeParse({ endDate: null }).success).toBe(true);
  expect(
    schemas.createExerciseNoteRequestSchema.safeParse({
      name: 'Duỗi gối',
      source: 'self',
      startDate: '2026-11-05',
      endDate: null,
    }).success,
  ).toBe(false);
});
