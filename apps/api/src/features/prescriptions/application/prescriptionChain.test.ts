import { describe, expect, it, vi } from 'vitest';
import { reusablePrescription } from '@src/shared/test/reusablePrescription.js';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import { listPrescriptions } from './listPrescriptions.js';
import { getPrescriptionDetail } from './getPrescriptionDetail.js';
import type { PrescriptionChainRepository, PrescriptionChainStore } from './prescriptionChainPorts.js';

function setup(consent: ConsentStatus | null = 'confirmed') {
  const first = reusablePrescription();
  const second = { ...first, id: 'p-2', items: [{ ...first.items[0]!, strength: '10mg' }] };
  const store: PrescriptionChainStore = {
    profileConsent: async () => consent,
    list: vi.fn(async () => []),
    findPosition: vi.fn(async (_profileId, id) =>
      id === second.id ? { previousId: first.id, nextId: null } : null,
    ),
    findPrescription: vi.fn(async (_profileId, id) => (id === first.id ? first : second)),
    courses: vi.fn(async () => []),
  };
  const repository: PrescriptionChainRepository = { withFamily: (_id, work) => work(store) };
  return { repository, store, first, second };
}

describe('Application đọc chuỗi đơn (SPEC-045)', () => {
  it.each([null, 'pending', 'invited', 'declined', 'withdrawn'] as const)(
    'TC-484: cổng đồng thuận %s chặn đọc danh sách và chi tiết trước truy vấn đơn',
    async (consent) => {
      const f = setup(consent);
      const expected = { ok: false, code: consent === null ? 'ERR_NOT_FOUND' : 'ERR_CONSENT_REQUIRED' };
      expect(await listPrescriptions(f.repository, 'family', 'profile')).toEqual(expected);
      expect(await getPrescriptionDetail(f.repository, 'family', 'profile', 'p-2')).toEqual(expected);
      expect(f.store.list).not.toHaveBeenCalled();
      expect(f.store.findPosition).not.toHaveBeenCalled();
      expect(f.store.findPrescription).not.toHaveBeenCalled();
      expect(f.store.courses).not.toHaveBeenCalled();
    },
  );

  it('TC-484: đọc danh sách qua port, không thấy đơn trả 404; tính diff từ liền trước', async () => {
    const f = setup();
    expect(await listPrescriptions(f.repository, 'family', 'profile')).toEqual({ ok: true, value: [] });
    expect(await getPrescriptionDetail(f.repository, 'family', 'profile', 'missing')).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    const result = await getPrescriptionDetail(f.repository, 'family', 'profile', f.second.id);
    expect(result).toMatchObject({
      ok: true,
      value: {
        prescription: f.second,
        previousId: f.first.id,
        nextId: null,
        courses: [],
        diff: { changed: [{ changes: [{ field: 'strength', before: '5mg', after: '10mg' }] }] },
      },
    });
  });

  it('TC-484: đơn đầu không tải đơn trước và trả diff null', async () => {
    const f = setup();
    vi.mocked(f.store.findPosition).mockResolvedValue({ previousId: null, nextId: null });
    expect(await getPrescriptionDetail(f.repository, 'family', 'profile', f.first.id)).toMatchObject({
      ok: true,
      value: { previousId: null, nextId: null, diff: null },
    });
    expect(f.store.findPrescription).toHaveBeenCalledTimes(1);
  });
});
