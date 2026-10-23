import { describe, expect, it } from 'vitest';
import type { FamilyAccount } from '@src/features/reminders/domain/ReminderRecipient.js';
import { getMyReminder } from './getMyReminder.js';
import type { MyReminderRepository } from './ports.js';

type LoadedMyReminder = NonNullable<Awaited<ReturnType<MyReminderRepository['load']>>>;

const REMINDER_ID = '0b9f3c1e-6a3d-4a8e-9a51-2f4c1d7e8b90';
const FAMILY_ID = 'family-a';
const accounts: FamilyAccount[] = [
  { id: 'dad', displayName: 'Bố', role: 'main', healthProfileId: null },
  { id: 'mom', displayName: 'Mẹ', role: 'main', healthProfileId: null },
  { id: 'grandma', displayName: 'Bà', role: 'member', healthProfileId: 'grandma-profile' },
  { id: 'uncle', displayName: 'Chú', role: 'member', healthProfileId: null },
];
const medication = { name: 'Canxi', strength: '500 mg', quantityPerDose: '1', doseUnit: 'viên' };

const loaded = (overrides: Partial<LoadedMyReminder['reminder']> = {}, assigned: string[] = []) => ({
  reminder: {
    id: REMINDER_ID,
    date: '2026-10-23',
    slot: 'morning' as const,
    scheduledAt: '2026-10-23T00:00:00.000Z',
    profileName: 'Bà',
    medications: [{ ...medication, courseId: 'course-1' }],
    profileId: 'grandma-profile',
    consentConfirmed: true,
    ...overrides,
  },
  familyAccounts: accounts,
  assignedAccountIds: assigned,
});

const repositoryOf = (result: LoadedMyReminder | null) => {
  const calls: [string, string][] = [];
  const repository: MyReminderRepository = {
    load: (familyId, reminderId) => {
      calls.push([familyId, reminderId]);
      return Promise.resolve(result);
    },
  };
  return { repository, calls };
};
const read = (result: LoadedMyReminder | null, accountId: string, reminderId = REMINDER_ID) =>
  getMyReminder(repositoryOf(result).repository, { familyId: FAMILY_ID, accountId }, reminderId);
const notFound = { ok: false, code: 'ERR_NOT_FOUND' };

describe('getMyReminder (SPEC-035, BR-039)', () => {
  it('TC-344: member liên kết đúng hồ sơ đọc được lời nhắc, thuốc không còn courseId', async () => {
    expect(await read(loaded(), 'grandma')).toEqual({
      ok: true,
      value: {
        id: REMINDER_ID,
        date: '2026-10-23',
        slot: 'morning',
        scheduledAt: '2026-10-23T00:00:00.000Z',
        profileName: 'Bà',
        medications: [medication],
      },
    });
  });
  it('TC-344: member khác trong gia đình nhận ERR_NOT_FOUND', async () => {
    expect(await read(loaded(), 'uncle')).toEqual(notFound);
  });
  it('TC-345: main đã được chỉ định cho hồ sơ không liên kết đọc được lời nhắc', async () => {
    const result = await read(loaded({ profileId: 'child-profile' }, ['dad']), 'dad');
    expect(result).toMatchObject({ ok: true, value: { id: REMINDER_ID } });
  });
  it('TC-345: main không được chỉ định nhận ERR_NOT_FOUND', async () => {
    expect(await read(loaded({ profileId: 'child-profile' }, ['dad']), 'mom')).toEqual(notFound);
  });
  it('TC-345: hồ sơ đã liên kết tài khoản khác thì main từng được chỉ định nhận ERR_NOT_FOUND', async () => {
    expect(await read(loaded({}, ['dad']), 'dad')).toEqual(notFound);
  });
  it('hồ sơ chưa đồng thuận nhận ERR_NOT_FOUND kể cả với tài khoản liên kết', async () => {
    expect(await read(loaded({ consentConfirmed: false }), 'grandma')).toEqual(notFound);
  });
  it('không tìm thấy lời nhắc trong gia đình nhận ERR_NOT_FOUND', async () => {
    expect(await read(null, 'grandma')).toEqual(notFound);
  });
  it('TC-344: reminderId không phải UUID nhận ERR_NOT_FOUND, không chạm kho', async () => {
    const { repository, calls } = repositoryOf(loaded());
    const actor = { familyId: FAMILY_ID, accountId: 'grandma' };
    expect(await getMyReminder(repository, actor, 'not-a-uuid')).toEqual(notFound);
    expect(calls).toEqual([]);
  });
});
