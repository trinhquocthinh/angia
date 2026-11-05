import { describe, expect, it, vi } from 'vitest';
import type { TimelineEvent } from '@angia/contracts';
import { reusablePrescription } from '@src/shared/test/reusablePrescription.js';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import { listTimeline } from './listTimeline.js';
import { decodeTimelineCursor } from './timelineCursor.js';
import type { TimelineRepository } from './ports.js';

type TimelineStore = Parameters<Parameters<TimelineRepository['withFamily']>[1]>[0];

function setup(
  consent: ConsentStatus | null = 'confirmed',
  birthYear = 1950,
  vitalsEnabled: boolean | null = null,
) {
  const store: TimelineStore = {
    profile: async () => (consent === null ? null : { consentStatus: consent, birthYear, vitalsEnabled }),
    sources: vi.fn(async () => []),
    prescriptionPairs: vi.fn(async () => []),
  };
  const repository: TimelineRepository = { withFamily: (_id, work) => work(store) };
  const read = (query = { limit: 50 }, now = () => new Date('2026-10-30T00:00:00Z')) =>
    listTimeline(repository, 'family', 'profile', query, now);
  return { store, read };
}

describe('Đọc dòng thời gian', () => {
  it.each([null, 'pending', 'invited', 'declined', 'withdrawn'] as const)(
    'TC-503: đồng thuận %s chặn đọc dữ liệu',
    async (status) => {
      const f = setup(status);
      expect(await f.read()).toEqual({
        ok: false,
        code: status === null ? 'ERR_NOT_FOUND' : 'ERR_CONSENT_REQUIRED',
      });
      expect(f.store.sources).not.toHaveBeenCalled();
    },
  );

  it('TC-504: cursor sai bị từ chối trước truy vấn, hồ sơ rỗng trả trang rỗng', async () => {
    const f = setup();
    expect(
      await listTimeline({ withFamily: vi.fn() }, 'f', 'p', { limit: 50, cursor: 'bad' }, () => new Date()),
    ).toEqual({ ok: false, code: 'ERR_VALIDATION' });
    expect(await f.read()).toEqual({ ok: true, value: { items: [], nextCursor: null } });
  });

  it('TC-504: trộn nguồn, cắt trang và lấy cursor từ sự kiện cuối đã trả', async () => {
    const f = setup();
    const event = (id: string, date: string): TimelineEvent => ({
      id,
      date,
      time: null,
      kind: 'revisit',
      data: { prescriptionIds: [] },
    });
    vi.mocked(f.store.sources).mockResolvedValue([
      [event('2026-10-28', '2026-10-28')],
      [event('2026-10-30', '2026-10-30'), event('2026-10-29', '2026-10-29')],
    ]);
    const result = await f.read({ limit: 2 });
    expect(result).toMatchObject({
      ok: true,
      value: { items: [{ date: '2026-10-30' }, { date: '2026-10-29' }] },
    });
    if (result.ok)
      expect(decodeTimelineCursor(result.value.nextCursor!)).toEqual({
        id: '2026-10-29',
        date: '2026-10-29',
        time: null,
        kind: 'revisit',
      });
  });

  it.each([
    [2011, null, false],
    [2010, null, true],
    [2020, true, true],
  ] as const)('TC-505: năm sinh %i, bật số đo %s → nguồn số đo %s', async (year, enabled, expected) => {
    const f = setup('confirmed', year, enabled);
    await f.read();
    expect(f.store.sources).toHaveBeenCalledWith('profile', { take: 51, after: null }, expected);
  });

  it('TC-505: xác định tuổi theo năm tại Việt Nam', async () => {
    const f = setup('confirmed', 2011);
    await f.read({ limit: 1 }, () => new Date('2026-12-31T17:00:00Z'));
    expect(f.store.sources).toHaveBeenCalledWith('profile', { take: 2, after: null }, true);
  });

  it('TC-503: tóm tắt diff từ đơn trước ngoài trang, đơn đầu trả null', async () => {
    const f = setup();
    const previous = reusablePrescription();
    const current = {
      ...previous,
      id: 'current',
      items: previous.items.map((item, i) => (i === 0 ? { ...item, strength: '10mg' } : item)),
    };
    const event: TimelineEvent = {
      id: current.id,
      date: '2026-10-30',
      time: null,
      kind: 'prescription',
      data: { prescriptionId: current.id, facility: null, diagnosis: null, itemCount: 1, diffSummary: null },
    };
    vi.mocked(f.store.sources).mockResolvedValue([[event]]);
    vi.mocked(f.store.prescriptionPairs).mockResolvedValue([{ current, previous }]);
    expect(await f.read()).toMatchObject({
      ok: true,
      value: { items: [{ data: { diffSummary: { added: 0, removed: 0, changed: 1 } } }] },
    });
    vi.mocked(f.store.prescriptionPairs).mockResolvedValue([{ current, previous: null }]);
    expect(await f.read()).toMatchObject({ ok: true, value: { items: [{ data: { diffSummary: null } }] } });
  });
});
