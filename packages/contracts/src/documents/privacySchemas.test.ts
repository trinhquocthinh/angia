import { expect, it } from 'vitest';
import { privacyEditsSchema } from './privacySchemas.js';

const crop = { left: 0, top: 0, width: 1_000_000, height: 1_000_000 };

it('TC-425: nhận bốn góc xoay và tối đa 32 vùng che', () => {
  for (const rotation of [0, 90, 180, 270]) {
    expect(privacyEditsSchema.safeParse({ rotation, crop, masks: Array(32).fill(crop) }).success).toBe(true);
  }
});

it('TC-425: từ chối hình học sai, quá nhiều vùng che và trường ngoài hợp đồng', () => {
  const edits = { rotation: 0, crop, masks: [] };
  for (const input of [
    { ...edits, rotation: 45 },
    { ...edits, crop: { ...crop, left: 1 } },
    { ...edits, crop: { ...crop, top: 1 } },
    { ...edits, crop: { ...crop, width: 0 } },
    { ...edits, crop: { ...crop, left: -1 } },
    { ...edits, crop: { ...crop, width: 0.5 } },
    { ...edits, masks: [{ ...crop, left: 1 }] },
    { ...edits, masks: Array(33).fill(crop) },
    { ...edits, familyId: 'fake' },
  ]) {
    expect(privacyEditsSchema.safeParse(input).success).toBe(false);
  }
});
