import { describe, expect, it } from 'vitest';
import { createMemoryAdherenceRepository } from '@src/shared/test/createMemoryAdherenceRepository.js';
import { listAdherencePeriods } from './listAdherencePeriods.js';
import { recordAdherencePeriod } from './recordAdherencePeriod.js';

const now = () => new Date('2026-10-12T17:30:00Z');
const base = { familyId: 'family-a', accountId: 'acc', profileId: 'me', status: 'taking' as const };

describe('Liệt kê giai đoạn dùng thực tế của hồ sơ', () => {
  it('TC-262: theo tên chuẩn hóa rồi mốc tăng dần, kèm hôm nay theo Việt Nam', async () => {
    const m = createMemoryAdherenceRepository();
    await recordAdherencePeriod(
      m.repository,
      { ...base, medicationName: 'Metformin', fromDate: '2026-09-01' },
      now,
    );
    await recordAdherencePeriod(
      m.repository,
      { ...base, medicationName: 'Amlodipin', fromDate: '2026-09-01' },
      now,
    );
    await recordAdherencePeriod(
      m.repository,
      { ...base, medicationName: 'Amlodipin', status: 'stopped', fromDate: '2026-10-10' },
      now,
    );
    const result = await listAdherencePeriods(m.repository, 'family-a', 'me', now);
    expect(result).toMatchObject({
      ok: true,
      value: {
        today: '2026-10-13',
        periods: [
          { medicationName: 'Amlodipin', fromDate: '2026-09-01', toDate: '2026-10-09' },
          { medicationName: 'Amlodipin', fromDate: '2026-10-10', toDate: null },
          { medicationName: 'Metformin', fromDate: '2026-09-01', toDate: null },
        ],
      },
    });
  });
  it('TC-262: hồ sơ khác gia đình trả ERR_NOT_FOUND, chưa đồng thuận trả ERR_CONSENT_REQUIRED', async () => {
    const m = createMemoryAdherenceRepository([{ id: 'me', familyId: 'family-a', consentStatus: 'pending' }]);
    expect(await listAdherencePeriods(m.repository, 'family-b', 'me', now)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await listAdherencePeriods(m.repository, 'family-a', 'me', now)).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
  });
});
