import type { DoseSlotList, MyReminder, MyRevisitReminder, ReminderRecipients } from '@angia/contracts';
import type { components } from '../src/shared/api/schema.gen.js';

export const REMINDER_PROFILE_ID = '0199bc85-8918-7000-8000-000000000020';
export const REMINDER_ID = '0199bc85-8918-7000-8000-000000000030';
export const REMINDER_ACCOUNT_ID = '0199bc85-8918-7000-8000-000000000101';

const profileSeed: components['schemas']['ProfileListItem'] = {
  id: REMINDER_PROFILE_ID,
  familyId: '0199bc85-8918-7000-8000-000000000001',
  displayName: 'Mẹ Ngọc Lan',
  birthYear: 1965,
  vitalsEnabled: null,
  consentConfirmedAt: '2026-01-01T00:00:00Z',
  consentConfirmedBy: REMINDER_ACCOUNT_ID,
  consentBasis: 'self',
  consentStatus: 'confirmed',
  consentSource: 'main_attested',
  consentRespondentName: 'Mẹ Ngọc Lan',
  createdAt: '2026-01-01T00:00:00Z',
  consentAction: null,
  hasLinkedAccount: false,
  consentConfirmedByName: 'Lan',
};

// Toàn bộ tên/thuốc là dữ liệu tổng hợp cho UI; không lấy từ DB người dùng.
export function reminderUiSeed(empty = false) {
  const profile = { ...profileSeed };
  const slots: DoseSlotList = empty
    ? []
    : [
        { slot: 'morning', time: '07:30' },
        { slot: 'noon', time: '12:00' },
        { slot: 'afternoon', time: '17:00' },
        { slot: 'evening', time: '20:00' },
      ];
  const candidates = [{ accountId: REMINDER_ACCOUNT_ID, displayName: 'Lan' }];
  const recipients: ReminderRecipients = {
    mode: 'assigned',
    recipients: empty ? [] : candidates,
    candidates,
  };
  const reminder: MyReminder = {
    id: REMINDER_ID,
    date: '2026-11-26',
    slot: 'evening',
    scheduledAt: '2026-11-26T13:00:00Z',
    profileName: profile.displayName,
    confirmation: null,
    canConfirm: true,
    canUndo: false,
    medications: [
      { name: 'Vitamin mẫu A', strength: '500 mg', quantityPerDose: '1', doseUnit: 'viên' },
      { name: 'Thuốc bôi mẫu', strength: null, quantityPerDose: null, doseUnit: null },
    ],
  };
  const revisit: MyRevisitReminder = {
    id: REMINDER_ID,
    profileId: profile.id,
    profileName: profile.displayName,
    revisitDate: '2026-11-26',
    offset: 'same_day',
    canOpenSummary: true,
    prescriptions: empty
      ? []
      : [
          { id: REMINDER_PROFILE_ID, issuedDate: '2026-11-20', facility: 'Cơ sở khám mẫu' },
          { id: REMINDER_ID, issuedDate: '2026-11-21', facility: null },
        ],
  };
  return { profile, slots, recipients, reminder, revisit };
}
