import { expect, it } from 'vitest';
import {
  createPrivacyDraftRequestSchema,
  approvePrivacyRequestSchema,
  privacyDraftSchema,
} from './privacySchemas.js';
const crop = { left: 0, top: 0, width: 1_000_000, height: 1_000_000 };
it('TC-162: vùng vượt ảnh, quá nhiều che hoặc giả danh actor → từ chối request riêng tư', () => {
  expect(
    createPrivacyDraftRequestSchema.safeParse({ rotation: 0, crop: { ...crop, left: 1 }, masks: [] }).success,
  ).toBe(false);
  expect(
    createPrivacyDraftRequestSchema.safeParse({ rotation: 0, crop, masks: Array(33).fill(crop) }).success,
  ).toBe(false);
  expect(
    createPrivacyDraftRequestSchema.safeParse({ rotation: 0, crop, masks: [], familyId: 'fake' }).success,
  ).toBe(false);
  expect(createPrivacyDraftRequestSchema.safeParse({ rotation: 0, crop, masks: [] }).success).toBe(true);
  expect(
    approvePrivacyRequestSchema.safeParse({
      draftId: '00000000-0000-4000-8000-000000000001',
      sha256: 'a'.repeat(64),
      confirmed: false,
    }).success,
  ).toBe(false);
});

it('TC-162a: bản ready thiếu hash hoặc trạng thái pending kèm ảnh → không thể coi là bản đã kiểm tra', () => {
  const draftId = '00000000-0000-4000-8000-000000000001';
  expect(privacyDraftSchema.safeParse({ state: 'ready', draftId, imageUrl: '/api/image' }).success).toBe(
    false,
  );
  expect(
    privacyDraftSchema.safeParse({
      state: 'pending',
      draftId,
      sha256: 'a'.repeat(64),
      imageUrl: '/api/image',
    }).success,
  ).toBe(false);
});
