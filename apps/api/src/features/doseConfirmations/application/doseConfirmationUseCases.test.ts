import { describe, expect, it, vi } from 'vitest';
import type { ConsentStatus } from '@src/features/profiles/domain/HealthProfile.js';
import { confirmDose } from './confirmDose.js';
import type { DoseConfirmationRepository, LockedReminder, StoredDoseConfirmation } from './ports.js';
import { reminderConfirmationState } from './reminderConfirmationState.js';
import { undoDoseConfirmation } from './undoDoseConfirmation.js';

const DATE = '2026-11-02';
// Biên ngày theo giờ Việt Nam (UTC+7) của DATE.
const FIRST_SECOND = () => new Date('2026-11-01T17:00:00.000Z');
const LAST_SECOND = () => new Date('2026-11-02T16:59:59.000Z');
const NEXT_DAY = () => new Date('2026-11-02T17:00:00.000Z');
const BEFORE_DAY = () => new Date('2026-11-01T16:59:59.000Z');

const actor = { familyId: 'f', accountId: 'linked', isMain: false, displayName: 'Mẹ' };
const stored = (accountId: string | null, displayName = 'Mẹ'): StoredDoseConfirmation => ({
  profileId: 'p',
  date: DATE,
  slot: 'morning',
  confirmedBy: { accountId, displayName },
  confirmedAt: '2026-11-02T01:00:00.000Z',
});
const reminder = (overrides: Partial<LockedReminder> = {}): LockedReminder => ({
  id: 'r',
  profileId: 'p',
  date: DATE,
  slot: 'morning',
  consentStatus: 'confirmed' as ConsentStatus,
  audience: { linked: true, recipientIds: ['linked'] },
  confirmation: null,
  ...overrides,
});
function repositoryOf(locked: LockedReminder | null) {
  const insert = vi.fn((_r: LockedReminder, accountId: string, displayName: string, confirmedAt: Date) =>
    Promise.resolve({ ...stored(accountId, displayName), confirmedAt: confirmedAt.toISOString() }),
  );
  const remove = vi.fn(() => Promise.resolve());
  const repository = {
    withFamily: (_familyId, work) => work({ lockReminder: () => Promise.resolve(locked), insert, remove }),
  } as DoseConfirmationRepository;
  return { repository, insert, remove };
}

describe('confirmDose (SPEC-046)', () => {
  it('TC-486: ghi người xác nhận, thời điểm và ảnh chụp tên', async () => {
    const { repository, insert } = repositoryOf(reminder());
    expect(await confirmDose(repository, actor, 'r', FIRST_SECOND)).toEqual({
      ok: true,
      value: {
        ...stored('linked'),
        reminderId: 'r',
        confirmedAt: FIRST_SECOND().toISOString(),
      },
    });
    expect(insert).toHaveBeenCalledOnce();
  });
  it('TC-489: biên 00:00:00 và 23:59:59 giờ Việt Nam là cùng ngày, ngoài biên → 422', async () => {
    for (const now of [FIRST_SECOND, LAST_SECOND])
      expect((await confirmDose(repositoryOf(reminder()).repository, actor, 'r', now)).ok).toBe(true);
    for (const now of [BEFORE_DAY, NEXT_DAY]) {
      const { repository, insert } = repositoryOf(reminder());
      expect(await confirmDose(repository, actor, 'r', now)).toEqual({ ok: false, code: 'ERR_VALIDATION' });
      expect(insert).not.toHaveBeenCalled();
    }
  });
  it('TC-490: đã có bản ghi → trả bản đó, không ghi đè người xác nhận', async () => {
    const main = { ...actor, accountId: 'main', isMain: true, displayName: 'Ba' };
    const { repository, insert } = repositoryOf(reminder({ confirmation: stored('linked') }));
    const result = await confirmDose(repository, main, 'r', LAST_SECOND);
    expect(result).toEqual({ ok: true, value: { ...stored('linked'), reminderId: 'r' } });
    expect(insert).not.toHaveBeenCalled();
  });
  it('TC-488: không phải người được phép → 404 trước khi lộ đồng thuận hay ngày', async () => {
    const stranger = { ...actor, accountId: 'other' };
    const withdrawn = reminder({ consentStatus: 'withdrawn', date: '2026-01-01' });
    const result = await confirmDose(repositoryOf(withdrawn).repository, stranger, 'r', LAST_SECOND);
    expect(result).toEqual({ ok: false, code: 'ERR_NOT_FOUND' });
  });
  it('Lời nhắc không tồn tại → 404', async () => {
    expect(await confirmDose(repositoryOf(null).repository, actor, 'r', LAST_SECOND)).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
  });
  it('TC-494: hồ sơ không confirmed → 409', async () => {
    for (const consentStatus of ['withdrawn', 'pending'] as const)
      expect(
        await confirmDose(repositoryOf(reminder({ consentStatus })).repository, actor, 'r', LAST_SECOND),
      ).toEqual({ ok: false, code: 'ERR_CONSENT_REQUIRED' });
  });
  it('Tên hiển thị dài hơn 60 ký tự được cắt theo ràng buộc ảnh chụp', async () => {
    const { repository, insert } = repositoryOf(reminder());
    await confirmDose(repository, { ...actor, displayName: 'a'.repeat(80) }, 'r', LAST_SECOND);
    expect(insert.mock.calls[0]?.[2]).toBe('a'.repeat(60));
  });
});

describe('undoDoseConfirmation (SPEC-046)', () => {
  it('TC-491: người đã xác nhận hủy được', async () => {
    const { repository, remove } = repositoryOf(reminder({ confirmation: stored('linked') }));
    expect(await undoDoseConfirmation(repository, actor, 'r', LAST_SECOND)).toEqual({ ok: true });
    expect(remove).toHaveBeenCalledOnce();
  });
  it('TC-491: người khác → 404, không xóa', async () => {
    const { repository, remove } = repositoryOf(reminder({ confirmation: stored('linked') }));
    expect(
      await undoDoseConfirmation(repository, { ...actor, accountId: 'other' }, 'r', LAST_SECOND),
    ).toEqual({
      ok: false,
      code: 'ERR_NOT_FOUND',
    });
    expect(remove).not.toHaveBeenCalled();
  });
  it('TC-489: qua ngày → 422, không xóa', async () => {
    const { repository, remove } = repositoryOf(reminder({ confirmation: stored('linked') }));
    expect(await undoDoseConfirmation(repository, actor, 'r', NEXT_DAY)).toEqual({
      ok: false,
      code: 'ERR_VALIDATION',
    });
    expect(remove).not.toHaveBeenCalled();
  });
  it('TC-494: hồ sơ đã rút đồng thuận → 409', async () => {
    const locked = reminder({ consentStatus: 'withdrawn', confirmation: stored('linked') });
    expect(await undoDoseConfirmation(repositoryOf(locked).repository, actor, 'r', LAST_SECOND)).toEqual({
      ok: false,
      code: 'ERR_CONSENT_REQUIRED',
    });
  });
});

describe('reminderConfirmationState (SPEC-046)', () => {
  const viewer = { accountId: 'linked', isMain: false };
  const audience = { linked: true, recipientIds: ['linked'] };
  const state = (date: string, confirmation: StoredDoseConfirmation | null, who = viewer) =>
    reminderConfirmationState({ id: 'r', date }, who, audience, confirmation, DATE);

  it('Trong ngày, chưa xác nhận: chỉ bật canConfirm', () => {
    expect(state(DATE, null)).toEqual({ confirmation: null, canConfirm: true, canUndo: false });
  });
  it('TC-486: trong ngày, đã xác nhận: chỉ bật canUndo, kèm reminderId của lời nhắc', () => {
    expect(state(DATE, stored('linked'))).toEqual({
      confirmation: { ...stored('linked'), reminderId: 'r' },
      canConfirm: false,
      canUndo: true,
    });
  });
  it('TC-489: ngày khác chỉ đọc', () => {
    expect(state('2026-11-01', null)).toMatchObject({ canConfirm: false, canUndo: false });
    expect(state('2026-11-01', stored('linked'))).toMatchObject({ canConfirm: false, canUndo: false });
  });
  it('TC-488: người không được phép không có nút', () => {
    expect(state(DATE, null, { accountId: 'other', isMain: false })).toMatchObject({
      canConfirm: false,
      canUndo: false,
    });
  });
});
