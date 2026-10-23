import { describe, expect, it } from 'vitest';
import type { CourseSnapshot, ProfileSnapshot } from '../domain/DailyReminder.js';
import type { FamilyAccount } from '@src/shared/domain/FamilyAccount.js';
import { createMemoryReminderRepository } from '@src/shared/test/createMemoryReminderRepository.js';
import { generateReminders } from './generateReminders.js';

const fam = (n: number) => `0199a000-0000-7000-8000-${String(n).padStart(12, '0')}`;
const id = (n: number) => `0199b000-0000-7000-8000-${String(n).padStart(12, '0')}`;
const MAIN: FamilyAccount = { id: id(100), role: 'main', healthProfileId: null };

const course = (n: number, slots: string[] = ['morning']): CourseSnapshot => ({
  id: id(200 + n),
  name: `Thuốc ${n}`,
  strength: null,
  quantityPerDose: '1',
  doseUnit: 'viên',
  slots,
  startDate: '2026-10-01',
  endDate: null,
});

const profile = (n: number, overrides: Partial<ProfileSnapshot> = {}): ProfileSnapshot => ({
  profileId: id(n),
  consentConfirmed: true,
  slotTimes: { morning: '07:00', evening: '19:00' },
  courses: [course(n)],
  assignedAccountIds: [MAIN.id],
  ...overrides,
});

describe('generateReminders (SPEC-027)', () => {
  it('TC-073: chạy lại cho cùng ngày D không làm đổi số lượng lời nhắc', async () => {
    const repository = createMemoryReminderRepository({
      [fam(1)]: {
        accounts: [MAIN],
        profiles: [profile(1, { courses: [course(1, ['morning', 'evening'])] })],
      },
    });
    const first = await generateReminders(repository, '2026-10-23');
    const second = await generateReminders(repository, '2026-10-23');
    expect(first.totals).toMatchObject({ families: 1, created: 2, existing: 0, failedFamilies: 0 });
    expect(second.totals).toMatchObject({ families: 1, created: 0, existing: 2, failedFamilies: 0 });
    expect(repository.stored()).toHaveLength(2);
  });

  it('Lỗi một gia đình không chặn gia đình khác; báo lỗi chỉ bằng mã', async () => {
    const repository = createMemoryReminderRepository(
      {
        [fam(1)]: { accounts: [MAIN], profiles: [profile(1)] },
        [fam(2)]: { accounts: [MAIN], profiles: [profile(2)] },
      },
      { failingFamilyId: fam(1) },
    );
    const result = await generateReminders(repository, '2026-10-23');
    expect(result.families[0]).toMatchObject({ familyId: fam(1), outcome: 'error', reason: '42501' });
    expect(result.families[1]).toMatchObject({ familyId: fam(2), outcome: 'generated', created: 1 });
    expect(result.totals.failedFamilies).toBe(1);
  });

  it('Báo cáo hồ sơ bị bỏ qua và buổi thiếu khung giờ theo id, không kèm tên thuốc', async () => {
    const repository = createMemoryReminderRepository({
      [fam(1)]: {
        accounts: [MAIN],
        profiles: [
          profile(1, { consentConfirmed: false }),
          profile(2, { assignedAccountIds: [] }),
          profile(3, { courses: [course(3, ['noon'])] }),
        ],
      },
    });
    const result = await generateReminders(repository, '2026-10-23');
    expect(result.families[0]).toMatchObject({
      created: 0,
      skippedProfiles: [
        { profileId: id(1), reason: 'no_consent' },
        { profileId: id(2), reason: 'no_recipients' },
      ],
      unscheduledSlots: [{ profileId: id(3), slot: 'noon' }],
    });
    expect(JSON.stringify(result)).not.toContain('Thuốc');
  });

  it('Dừng trước gia đình kế tiếp khi job bị hủy', async () => {
    const repository = createMemoryReminderRepository({
      [fam(1)]: { accounts: [MAIN], profiles: [profile(1)] },
    });
    const controller = new AbortController();
    controller.abort();
    const result = await generateReminders(repository, '2026-10-23', controller.signal);
    expect(result).toMatchObject({ aborted: true, totals: { families: 0 } });
  });

  it('Không đọc được danh sách gia đình → listError, không ném lỗi', async () => {
    const repository = createMemoryReminderRepository({}, { listFails: true });
    const result = await generateReminders(repository, '2026-10-23');
    expect(result.listError).toBe('ECONNREFUSED');
  });
});
