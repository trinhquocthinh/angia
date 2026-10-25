import { describe, expect, it } from 'vitest';
import { createMemoryDoseSlotRepository } from '@src/shared/test/createMemoryDoseSlotRepository.js';
import { getDoseSlots } from './getDoseSlots.js';
import { setDoseSlots } from './setDoseSlots.js';

const request = { familyId: 'family-a', profileId: 'me', slots: { morning: '07:00', evening: '19:00' } };

describe('TC-380: hồ sơ đã rút đồng thuận — đọc khung giờ', () => {
  it('getDoseSlots → ERR_CONSENT_REQUIRED, không đọc danh sách khung giờ', async () => {
    const m = createMemoryDoseSlotRepository([
      { id: 'me', familyId: 'family-a', consentStatus: 'withdrawn' },
    ]);
    let listed = 0;
    const repository: typeof m.repository = {
      withFamily: (familyId, work) =>
        m.repository.withFamily(familyId, (store) =>
          work({
            ...store,
            listSlots: async (id) => {
              listed += 1;
              return store.listSlots(id);
            },
          }),
        ),
    };
    expect(await getDoseSlots(repository, 'family-a', 'me')).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
    expect(listed).toBe(0);
  });
});

describe('Cấu hình khung giờ buổi cho hồ sơ (SPEC-025)', () => {
  it('TC-067: hồ sơ "Mẹ" lưu thành công 02 khung giờ Sáng 07:00, Tối 19:00', async () => {
    const m = createMemoryDoseSlotRepository();
    const expected = [
      { slot: 'morning', time: '07:00' },
      { slot: 'evening', time: '19:00' },
    ];
    expect(await setDoseSlots(m.repository, request)).toEqual({ ok: true, value: expected });
    expect(await getDoseSlots(m.repository, 'family-a', 'me')).toEqual({ ok: true, value: expected });
  });
  it('TC-068: Sáng 20:00 sau Tối 19:00 trả ERR_VALIDATION, cấu hình cũ giữ nguyên', async () => {
    const m = createMemoryDoseSlotRepository();
    await setDoseSlots(m.repository, request);
    const before = structuredClone(m.state.slots);
    expect(
      await setDoseSlots(m.repository, { ...request, slots: { morning: '20:00', evening: '19:00' } }),
    ).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(m.state.slots).toEqual(before);
  });
  it('TC-067: lưu lại là thay toàn bộ — buổi không gửi bị bỏ', async () => {
    const m = createMemoryDoseSlotRepository();
    await setDoseSlots(m.repository, request);
    expect(await setDoseSlots(m.repository, { ...request, slots: { noon: '11:30' } })).toEqual({
      ok: true,
      value: [{ slot: 'noon', time: '11:30' }],
    });
    expect(m.state.slots.map((s) => s.slot)).toEqual(['noon']);
  });
  it('hồ sơ gia đình khác trả ERR_NOT_FOUND, chưa đồng thuận trả ERR_CONSENT_REQUIRED, không ghi', async () => {
    const m = createMemoryDoseSlotRepository([{ id: 'me', familyId: 'family-a', consentStatus: 'pending' }]);
    expect(await setDoseSlots(m.repository, { ...request, familyId: 'family-b' })).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await getDoseSlots(m.repository, 'family-b', 'me')).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
    expect(await setDoseSlots(m.repository, request)).toEqual({ ok: false, code: 'ERR_CONSENT_REQUIRED' });
    expect(m.state.slots).toEqual([]);
  });
});
