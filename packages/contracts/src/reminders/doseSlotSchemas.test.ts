import { describe, expect, it } from 'vitest';
import { doseSlotListSchema, setDoseSlotsRequestSchema } from './doseSlotSchemas.js';

describe('Hợp đồng khung giờ buổi (SPEC-025)', () => {
  it('TC-067: nhận giờ HH:mm cho một phần các buổi', () => {
    expect(setDoseSlotsRequestSchema.parse({ slots: { morning: '07:00', evening: '19:00' } })).toEqual({
      slots: { morning: '07:00', evening: '19:00' },
    });
    expect(setDoseSlotsRequestSchema.parse({ slots: {} })).toEqual({ slots: {} });
  });
  it('TC-068: từ chối giờ sai định dạng, buổi lạ và trường ngoài hợp đồng', () => {
    for (const body of [
      { slots: { morning: '7:00' } },
      { slots: { morning: '24:00' } },
      { slots: { noon: '12:60' } },
      { slots: { morning: '07:00:00' } },
      { slots: { as_needed: '08:00' } },
      { slots: { morning: '07:00' }, extra: true },
      {},
    ]) {
      expect(setDoseSlotsRequestSchema.safeParse(body).success).toBe(false);
    }
  });
  it('phản hồi là danh sách buổi kèm giờ', () => {
    expect(doseSlotListSchema.parse([{ slot: 'morning', time: '07:00' }])).toEqual([
      { slot: 'morning', time: '07:00' },
    ]);
  });
});
