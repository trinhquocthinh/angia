import { expect, it } from 'vitest';
import { mapPrivacyEdits } from './mapPrivacyEdits.js';
const full = { left: 0, top: 0, width: 1_000_000, height: 1_000_000 };
const edits = { rotation: 0 as const, crop: full, masks: [] };
it('TC-180: crop giữ độ phân giải; vùng che làm tròn ra ngoài thêm một pixel và chặn mép ảnh', () => {
  expect(
    mapPrivacyEdits(
      {
        ...edits,
        crop: { left: 100_000, top: 200_000, width: 400_000, height: 300_000 },
        masks: [{ left: 150_000, top: 0, width: 100_000, height: 1_000_000 }],
      },
      11,
      7,
    ),
  ).toEqual({
    crop: { left: 1, top: 1, width: 5, height: 3 },
    masks: [{ left: 0, top: 0, width: 4, height: 7 }],
  });
});
it('TC-181: domain từ chối tọa độ thiếu/sai số nguyên, crop ngoài ảnh, hơn 32 vùng và rotation sai', () => {
  for (const invalid of [
    undefined,
    { ...edits, rotation: 45 },
    { ...edits, crop: { ...full, width: 0 } },
    { ...edits, crop: { ...full, left: 1 } },
    { ...edits, crop: { ...full, left: 0.5 } },
    { ...edits, masks: Array(33).fill(full) },
  ])
    expect(() => mapPrivacyEdits(invalid, 10, 10)).toThrow();
  expect(() => mapPrivacyEdits(edits, 0, 10)).toThrow();
  expect(() => mapPrivacyEdits(edits, 10, NaN)).toThrow();
});
