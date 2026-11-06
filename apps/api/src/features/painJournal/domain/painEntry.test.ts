import { afterEach, describe, expect, it, vi } from 'vitest';
import { preparePainEntry } from './painEntry.js';

const tracking = { status: 'tracking', resolvedOn: null } as const;
const resolved = { status: 'resolved', resolvedOn: '2026-11-20' } as const;
const invalid = { ok: false, code: 'ERR_VALIDATION' };
const entry = { level: 4, recordedAt: '2026-11-05T23:29:00+07:00', note: null };

afterEach(() => vi.useRealTimers());

describe('Lần ghi đau — BR-059, BR-060', () => {
  it.each(['2026-11-05T23:29:00+07:00', '2026-10-01T00:00:00+07:00', '2026-11-05T16:30:00Z'])(
    'TC-683: chấp nhận hồi tố và thời điểm bằng đồng hồ server %s',
    (recordedAt) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-05T23:30:00+07:00'));
      expect(
        preparePainEntry(tracking, { kind: 'create', value: { ...entry, recordedAt } }, new Date()),
      ).toEqual({ ok: true, value: { ...entry, recordedAt } });
    },
  );

  it.each(['2026-11-06T00:01:00+07:00', '2026-11-05T16:30:00.001Z'])(
    'TC-683: từ chối thời điểm tương lai %s',
    (recordedAt) => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-11-05T23:30:00+07:00'));
      expect(
        preparePainEntry(tracking, { kind: 'create', value: { ...entry, recordedAt } }, new Date()),
      ).toEqual(invalid);
    },
  );

  it('TC-683: mặc định thời điểm từ đồng hồ server khi tạo', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-05T23:30:00+07:00'));
    expect(preparePainEntry(tracking, { kind: 'create', value: { level: 4 } }, new Date())).toEqual({
      ok: true,
      value: { level: 4, recordedAt: '2026-11-05T16:30:00.000Z', note: null },
    });
  });

  it.each([0, 11, 1.5, NaN, Infinity])('TC-664: từ chối mức đau không hợp lệ %s', (level) => {
    expect(
      preparePainEntry(
        tracking,
        { kind: 'create', value: { ...entry, level } },
        new Date('2026-11-21T00:00:00Z'),
      ),
    ).toEqual(invalid);
  });

  it.each([1, 10])('TC-676: chấp nhận mức đau tại biên %s', (level) => {
    expect(
      preparePainEntry(
        tracking,
        { kind: 'create', value: { ...entry, level } },
        new Date('2026-11-21T00:00:00Z'),
      ),
    ).toEqual({ ok: true, value: { ...entry, level } });
  });

  it('TC-677: không tạo lần ghi vào vấn đề đã khỏi', () => {
    expect(
      preparePainEntry(resolved, { kind: 'create', value: entry }, new Date('2026-11-21T00:00:00Z')),
    ).toEqual({ ok: false, code: 'ERR_INVALID_STATE_TRANSITION' });
  });

  it.each(['2026-11-20T23:59:59.999+07:00', '2026-11-20T16:59:59.999Z'])(
    'TC-681: sửa được đến cuối ngày khỏi VN %s',
    (recordedAt) => {
      expect(
        preparePainEntry(
          resolved,
          { kind: 'update', value: { ...entry, recordedAt } },
          new Date('2026-11-21T00:00:00Z'),
        ),
      ).toEqual({ ok: true, value: { ...entry, recordedAt } });
    },
  );

  it.each(['2026-11-21T00:00:00+07:00', '2026-11-20T17:00:00Z'])(
    'TC-681: từ chối sửa sang ngày sau ngày khỏi VN %s',
    (recordedAt) => {
      expect(
        preparePainEntry(
          resolved,
          { kind: 'update', value: { ...entry, recordedAt } },
          new Date('2026-11-21T00:00:00Z'),
        ),
      ).toEqual(invalid);
    },
  );

  it.each([tracking, resolved])('TC-680: sửa được mà không thay đổi đầu vào $status', (issue) => {
    const command = { kind: 'update', value: { ...entry, note: 'Đau khi đi bộ' } } as const;
    const before = structuredClone({ issue, command });
    expect(preparePainEntry(issue, command, new Date('2026-11-21T00:00:00Z'))).toEqual({
      ok: true,
      value: command.value,
    });
    expect({ issue, command }).toEqual(before);
  });

  it('TC-683: sửa cũng từ chối tương lai dù vấn đề đang theo dõi', () => {
    expect(
      preparePainEntry(tracking, { kind: 'update', value: entry }, new Date('2026-10-01T00:00:00Z')),
    ).toEqual(invalid);
  });

  it('TC-683: từ chối thời điểm không đọc được', () => {
    expect(
      preparePainEntry(tracking, { kind: 'create', value: { ...entry, recordedAt: 'sai' } }, new Date()),
    ).toEqual(invalid);
  });
});
