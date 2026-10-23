import { describe, expect, it } from 'vitest';
import type { CourseSnapshot, ProfileSnapshot } from './DailyReminder.js';
import type { FamilyAccount } from '@src/shared/domain/FamilyAccount.js';
import { planProfileReminders } from './planProfileReminders.js';

const PROFILE = '0199a000-0000-7000-8000-000000000001';
const MOTHER = '0199b000-0000-7000-8000-000000000001';
const FATHER = '0199b000-0000-7000-8000-000000000002';
const MEMBER = '0199b000-0000-7000-8000-000000000003';

let seq = 0;
function course(overrides: Partial<CourseSnapshot> = {}): CourseSnapshot {
  seq += 1;
  return {
    id: `0199c000-0000-7000-8000-${String(seq).padStart(12, '0')}`,
    name: `Thuốc ${seq}`,
    strength: '500mg',
    quantityPerDose: '1',
    doseUnit: 'viên',
    slots: ['morning'],
    startDate: '2026-10-01',
    endDate: null,
    ...overrides,
  };
}

function profile(overrides: Partial<ProfileSnapshot> = {}): ProfileSnapshot {
  return {
    profileId: PROFILE,
    consentConfirmed: true,
    slotTimes: { morning: '07:00', evening: '19:00' },
    courses: [],
    assignedAccountIds: [MOTHER, FATHER],
    ...overrides,
  };
}

const mains: FamilyAccount[] = [
  { id: MOTHER, role: 'main', healthProfileId: null },
  { id: FATHER, role: 'main', healthProfileId: null },
];

describe('planProfileReminders (SPEC-027)', () => {
  it('TC-071: 3 thuốc buổi sáng, giờ sáng 07:00 → đúng 01 lời nhắc lúc 07:00 gộp đủ 3 thuốc', () => {
    const courses = [
      course({ name: 'Metformin' }),
      course({ name: 'Amlodipin' }),
      course({ name: 'Aspirin' }),
    ];
    const plan = planProfileReminders(profile({ courses }), mains, '2026-10-23');
    expect(plan.outcome).toBe('planned');
    if (plan.outcome !== 'planned') return;
    expect(plan.reminders).toHaveLength(1);
    const [reminder] = plan.reminders;
    expect(reminder).toMatchObject({ profileId: PROFILE, date: '2026-10-23', slot: 'morning' });
    expect(reminder?.scheduledAt.toISOString()).toBe('2026-10-23T00:00:00.000Z');
    expect(reminder?.medications.map((m) => m.name)).toEqual(['Amlodipin', 'Aspirin', 'Metformin']);
    expect(reminder?.medications[0]).toEqual({
      courseId: courses[1]?.id,
      name: 'Amlodipin',
      strength: '500mg',
      quantityPerDose: '1',
      doseUnit: 'viên',
    });
  });

  it('TC-072: đợt kết thúc 30/10 không xuất hiện trong lời nhắc ngày 31/10', () => {
    const ended = course({ name: 'Kháng sinh', endDate: '2026-10-30' });
    const ongoing = course({ name: 'Vitamin' });
    const onLastDay = planProfileReminders(profile({ courses: [ended, ongoing] }), mains, '2026-10-30');
    const nextDay = planProfileReminders(profile({ courses: [ended, ongoing] }), mains, '2026-10-31');
    const names = (plan: typeof nextDay) =>
      plan.outcome === 'planned' ? plan.reminders.flatMap((r) => r.medications.map((m) => m.name)) : [];
    expect(names(onLastDay)).toEqual(['Kháng sinh', 'Vitamin']);
    expect(names(nextDay)).toEqual(['Vitamin']);
  });

  it('BR-038: đợt chưa bắt đầu hoặc đã dừng (ngày kết thúc = ngày dừng − 1) không sinh nhắc', () => {
    const future = course({ startDate: '2026-10-24' });
    const stopped = course({ endDate: '2026-10-22' });
    const plan = planProfileReminders(profile({ courses: [future, stopped] }), mains, '2026-10-23');
    expect(plan).toEqual({ outcome: 'planned', reminders: [], unscheduledSlots: [] });
  });

  it('TC-074: hồ sơ "Bé An" có 02 người nhận chỉ định → lời nhắc phân bổ tới cả 02 tài khoản', () => {
    const plan = planProfileReminders(profile({ courses: [course()] }), mains, '2026-10-23');
    expect(plan.outcome === 'planned' && plan.reminders[0]?.recipientAccountIds).toEqual([MOTHER, FATHER]);
  });

  it('BR-039: hồ sơ liên kết tài khoản chỉ nhắc tài khoản đó, bỏ qua danh sách đã lưu', () => {
    const accounts: FamilyAccount[] = [...mains, { id: MEMBER, role: 'member', healthProfileId: PROFILE }];
    const plan = planProfileReminders(profile({ courses: [course()] }), accounts, '2026-10-23');
    expect(plan.outcome === 'planned' && plan.reminders[0]?.recipientAccountIds).toEqual([MEMBER]);
  });

  it('BR-039: người nhận đã hết vai trò main hoặc rời gia đình bị lọc; không còn ai → bỏ qua hồ sơ', () => {
    const accounts: FamilyAccount[] = [{ id: MOTHER, role: 'member', healthProfileId: null }];
    const plan = planProfileReminders(profile({ courses: [course()] }), accounts, '2026-10-23');
    expect(plan).toEqual({ outcome: 'no_recipients' });
  });

  it('BR-039: hồ sơ không có thuốc buổi nào thì không cần người nhận, không cảnh báo', () => {
    const plan = planProfileReminders(profile({ assignedAccountIds: [] }), mains, '2026-10-23');
    expect(plan).toEqual({ outcome: 'planned', reminders: [], unscheduledSlots: [] });
  });

  it('SPEC-025: buổi có thuốc nhưng chưa có khung giờ bị bỏ qua và trả về để cảnh báo', () => {
    const courses = [course({ slots: ['morning', 'noon'] }), course({ slots: ['evening'] })];
    const plan = planProfileReminders(profile({ courses }), mains, '2026-10-23');
    expect(plan.outcome === 'planned' && plan.reminders.map((r) => r.slot)).toEqual(['morning', 'evening']);
    expect(plan.outcome === 'planned' && plan.unscheduledSlots).toEqual(['noon']);
  });

  it('SPEC-027: đợt "Khi cần" không sinh nhắc theo giờ', () => {
    const plan = planProfileReminders(
      profile({ courses: [course({ slots: ['as_needed'] })] }),
      mains,
      '2026-10-23',
    );
    expect(plan).toEqual({ outcome: 'planned', reminders: [], unscheduledSlots: [] });
  });

  it('Hồ sơ chưa đồng thuận không sinh nhắc (owner chốt 2026-10-23)', () => {
    const plan = planProfileReminders(
      profile({ consentConfirmed: false, courses: [course()] }),
      mains,
      '2026-10-23',
    );
    expect(plan).toEqual({ outcome: 'no_consent' });
  });

  it('Giờ dự kiến tính theo giờ Việt Nam (UTC+7) cho buổi tối', () => {
    const plan = planProfileReminders(
      profile({ courses: [course({ slots: ['evening'] })] }),
      mains,
      '2026-10-23',
    );
    expect(plan.outcome === 'planned' && plan.reminders[0]?.scheduledAt.toISOString()).toBe(
      '2026-10-23T12:00:00.000Z',
    );
  });
});
