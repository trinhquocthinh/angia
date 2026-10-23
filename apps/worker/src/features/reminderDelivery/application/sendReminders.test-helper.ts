import type { PushSubscriptionShape, SendOutcome } from '../domain/DeliveryTypes.js';
import type { ReminderNotifier } from './ports.js';
import type { FamilyAccount } from '@src/shared/domain/FamilyAccount.js';
import type { MemoryDeliveryFamily, MemoryDevice } from '@src/shared/test/createMemoryDeliveryRepository.js';

// Dữ liệu mẫu dùng chung cho các bộ test sendReminders (chỉ id giả, không dữ liệu người thật).
export const fam = (n: number) => `0199a000-0000-7000-8000-${String(n).padStart(12, '0')}`;
export const id = (n: number) => `0199b000-0000-7000-8000-${String(n).padStart(12, '0')}`;
export const NOW = new Date('2026-10-23T00:05:00.000Z');
export const SCHEDULED = new Date('2026-10-23T00:00:00.000Z');
export const plus = (minutes: number, base = NOW) => new Date(base.getTime() + minutes * 60_000);
export const MAIN_A: FamilyAccount = { id: id(1), role: 'main', healthProfileId: null };
export const MAIN_B: FamilyAccount = { id: id(2), role: 'main', healthProfileId: null };
export const PROFILE = id(10);
export const REMINDER = id(20);

export const device = (n: number, accountId: string): MemoryDevice => ({
  id: id(30 + n),
  accountId,
  subscription: { endpoint: `https://push.example/${n}`, keys: { p256dh: 'p', auth: 'a' } },
});

export function family(overrides: Partial<MemoryDeliveryFamily> = {}): MemoryDeliveryFamily {
  return {
    accounts: [MAIN_A, MAIN_B],
    profiles: [{ profileId: PROFILE, consentConfirmed: true, assignedAccountIds: [MAIN_A.id, MAIN_B.id] }],
    reminders: [{ reminderId: REMINDER, profileId: PROFILE, scheduledAt: SCHEDULED, sentAt: null }],
    devices: [device(1, MAIN_A.id), device(2, MAIN_B.id)],
    deliveries: [],
    ...overrides,
  };
}

export function fakeNotifier(outcomeFor: (endpoint: string) => SendOutcome = () => ({ kind: 'accepted' })) {
  const calls: { subscription: PushSubscriptionShape; reminderId: string; ttlSeconds: number }[] = [];
  const notifier: ReminderNotifier = {
    send: async (subscription, reminderId, ttlSeconds) => {
      calls.push({ subscription, reminderId, ttlSeconds });
      return outcomeFor(subscription.endpoint);
    },
  };
  return { notifier, calls };
}
