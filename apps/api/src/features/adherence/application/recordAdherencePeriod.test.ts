import { describe, expect, it } from 'vitest';
import { createMemoryAdherenceRepository } from '@src/shared/test/createMemoryAdherenceRepository.js';
import type { AdherenceRepository } from './ports.js';
import { recordAdherencePeriod } from './recordAdherencePeriod.js';

// 2026-10-13 09:00 giờ Việt Nam.
const now = () => new Date('2026-10-13T02:00:00Z');
const request = {
  familyId: 'family-a',
  accountId: 'acc-main',
  profileId: 'me',
  medicationName: ' Amlodipin ',
  status: 'taking' as const,
  fromDate: '2026-09-01',
};

describe('Ghi nhận giai đoạn dùng thực tế (SPEC-022)', () => {
  it('TC-062: ghi "stopped" từ 10/10 đóng giai đoạn mở vào 09/10 và mở giai đoạn mới', async () => {
    const m = createMemoryAdherenceRepository();
    await recordAdherencePeriod(m.repository, request, now);
    const result = await recordAdherencePeriod(
      m.repository,
      { ...request, medicationName: 'amlodipin', status: 'stopped', fromDate: '2026-10-10' },
      now,
    );
    expect(result).toMatchObject({
      ok: true,
      value: { status: 'stopped', fromDate: '2026-10-10', toDate: null, medicationName: 'amlodipin' },
    });
    expect(m.state.periods.map((p) => [p.status, p.fromDate, p.toDate, p.recordedBy])).toEqual([
      ['taking', '2026-09-01', '2026-10-09', 'acc-main'],
      ['stopped', '2026-10-10', null, 'acc-main'],
    ]);
  });
  it('TC-062: tên được cắt khoảng trắng và chuẩn hóa để so khớp cùng thuốc', async () => {
    const m = createMemoryAdherenceRepository();
    const result = await recordAdherencePeriod(m.repository, request, now);
    expect(result).toMatchObject({
      ok: true,
      value: { medicationName: 'Amlodipin', medicationNameNormalized: 'amlodipin', healthProfileId: 'me' },
    });
  });
  it('TC-063: mốc trước giai đoạn đang mở bị từ chối, dữ liệu không đổi', async () => {
    const m = createMemoryAdherenceRepository();
    await recordAdherencePeriod(m.repository, { ...request, fromDate: '2026-10-10' }, now);
    const before = structuredClone(m.state.periods);
    expect(
      await recordAdherencePeriod(
        m.repository,
        { ...request, status: 'stopped', fromDate: '2026-10-05' },
        now,
      ),
    ).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(m.state.periods).toEqual(before);
  });
  it('TC-261: mốc ngày mai theo giờ Việt Nam bị từ chối dù UTC còn hôm nay', async () => {
    const m = createMemoryAdherenceRepository();
    const lateUtc = () => new Date('2026-10-12T16:59:59Z');
    expect(
      await recordAdherencePeriod(m.repository, { ...request, fromDate: '2026-10-12' }, lateUtc),
    ).toMatchObject({ ok: true });
    expect(
      await recordAdherencePeriod(
        m.repository,
        { ...request, medicationName: 'B', fromDate: '2026-10-13' },
        lateUtc,
      ),
    ).toEqual({ ok: false, code: 'ERR_VALIDATION' });
  });
  it('TC-062: thuốc khác tên chuẩn hóa không đóng giai đoạn của nhau', async () => {
    const m = createMemoryAdherenceRepository();
    await recordAdherencePeriod(m.repository, request, now);
    await recordAdherencePeriod(
      m.repository,
      { ...request, medicationName: 'Metformin', fromDate: '2026-10-01' },
      now,
    );
    expect(m.state.periods.map((p) => p.toDate)).toEqual([null, null]);
  });
  it('TC-062: hồ sơ khác gia đình trả ERR_NOT_FOUND, chưa đồng thuận trả ERR_CONSENT_REQUIRED', async () => {
    const m = createMemoryAdherenceRepository([{ id: 'me', familyId: 'family-a', consentStatus: 'pending' }]);
    expect(await recordAdherencePeriod(m.repository, { ...request, familyId: 'family-b' }, now)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(await recordAdherencePeriod(m.repository, request, now)).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
    expect(m.state.periods).toEqual([]);
  });
  it('TC-062: lỗi ghi giai đoạn mới rollback việc đóng giai đoạn cũ', async () => {
    const m = createMemoryAdherenceRepository();
    await recordAdherencePeriod(m.repository, request, now);
    const failing: AdherenceRepository = {
      withFamily: (familyId, work) =>
        m.repository.withFamily(familyId, (store) =>
          work({
            ...store,
            insertPeriod: async () => {
              throw new Error('Lỗi ghi');
            },
          }),
        ),
    };
    await expect(
      recordAdherencePeriod(failing, { ...request, status: 'stopped', fromDate: '2026-10-10' }, now),
    ).rejects.toThrow('Lỗi ghi');
    expect(m.state.periods.map((p) => p.toDate)).toEqual([null]);
  });
});
