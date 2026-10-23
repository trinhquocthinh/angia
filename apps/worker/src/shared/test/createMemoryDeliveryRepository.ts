import type {
  DeliveryCandidate,
  DeliveryRepository,
  FanOutStore,
} from '@src/features/reminderDelivery/application/ports.js';
import type {
  DeliveryStatus,
  PushSubscriptionShape,
} from '@src/features/reminderDelivery/domain/DeliveryTypes.js';
import type { FamilyAccount } from '@src/shared/domain/FamilyAccount.js';

interface MemoryProfile {
  profileId: string;
  consentConfirmed: boolean;
  assignedAccountIds: string[];
}
interface MemoryReminder {
  reminderId: string;
  profileId: string;
  scheduledAt: Date;
  sentAt: Date | null;
}
export interface MemoryDevice {
  id: string;
  accountId: string;
  subscription: PushSubscriptionShape;
}
interface MemoryDelivery {
  id: string;
  reminderId: string;
  deviceId: string | null;
  status: DeliveryStatus;
  attempts: number;
  nextAttemptAt: Date;
  acceptedAt?: Date;
  lastError?: string;
}
export interface MemoryDeliveryFamily {
  accounts: FamilyAccount[];
  profiles: MemoryProfile[];
  reminders: MemoryReminder[];
  devices: MemoryDevice[];
  deliveries: MemoryDelivery[];
}
interface Faults {
  failingFanOutFamilyId?: string;
  listFails?: boolean;
  /** processNextDelivery của gia đình này ném lỗi sau `processed` đích đã xử lý. */
  failDeliveryAfter?: { familyId: string; processed: number };
}

function createFanOutStore(data: MemoryDeliveryFamily, calls: unknown[][]): FanOutStore {
  return {
    listUnsentDue: async (now) =>
      data.reminders
        .filter((r) => r.sentAt === null && r.scheduledAt.getTime() <= now.getTime())
        .map((r) => ({
          reminderId: r.reminderId,
          profileId: r.profileId,
          scheduledAt: r.scheduledAt,
          consentConfirmed: data.profiles.find((p) => p.profileId === r.profileId)?.consentConfirmed ?? false,
        })),
    listFamilyAccounts: async () => data.accounts,
    listAssignments: async () =>
      data.profiles.flatMap((p) =>
        p.assignedAccountIds.map((accountId) => ({ profileId: p.profileId, accountId })),
      ),
    listDeviceIds: async (accountIds) =>
      data.devices.filter((d) => accountIds.includes(d.accountId)).map((d) => d.id),
    markFannedOut: async (reminderId, deviceIds, now) => {
      calls.push([reminderId, deviceIds, now]);
      for (const deviceId of deviceIds) {
        if (data.deliveries.some((d) => d.reminderId === reminderId && d.deviceId === deviceId)) continue;
        data.deliveries.push({
          id: `${reminderId}|${deviceId}`,
          reminderId,
          deviceId,
          status: 'pending',
          attempts: 0,
          nextAttemptAt: now,
        });
      }
      const reminder = data.reminders.find((r) => r.reminderId === reminderId);
      if (reminder) reminder.sentAt = now;
    },
  };
}

function toCandidate(data: MemoryDeliveryFamily, row: MemoryDelivery): DeliveryCandidate {
  const reminder = data.reminders.find((r) => r.reminderId === row.reminderId)!;
  const profile = data.profiles.find((p) => p.profileId === reminder.profileId);
  const device = data.devices.find((d) => d.id === row.deviceId) ?? null;
  return {
    deliveryId: row.id,
    reminderId: row.reminderId,
    profileId: reminder.profileId,
    scheduledAt: reminder.scheduledAt,
    attempts: row.attempts,
    consentConfirmed: profile?.consentConfirmed ?? false,
    familyAccounts: data.accounts,
    assignedAccountIds: profile?.assignedAccountIds ?? [],
    device,
  };
}

// Repository bộ nhớ mô phỏng ledger reminder_deliveries: fan-out idempotent, gửi từng đích pending đến hạn.
export function createMemoryDeliveryRepository(
  families: Record<string, MemoryDeliveryFamily>,
  faults: Faults = {},
) {
  const fanOutCalls: unknown[][] = [];
  const processedByFamily = new Map<string, number>();
  const repository: DeliveryRepository = {
    listFamilyIds: async () => {
      if (faults.listFails) throw Object.assign(new Error('down'), { code: 'ECONNREFUSED' });
      return Object.keys(families);
    },
    withFanOut: async (familyId, work) => {
      if (familyId === faults.failingFanOutFamilyId)
        throw Object.assign(new Error('denied'), { code: '42501' });
      return work(createFanOutStore(families[familyId]!, fanOutCalls));
    },
    processNextDelivery: async (familyId, now, decide) => {
      const data = families[familyId]!;
      const processed = processedByFamily.get(familyId) ?? 0;
      const fault = faults.failDeliveryAfter;
      if (fault?.familyId === familyId && processed >= fault.processed)
        throw Object.assign(new Error('lost'), { code: '57P01' });
      processedByFamily.set(familyId, processed + 1);
      const row = data.deliveries.find(
        (d) => d.status === 'pending' && d.nextAttemptAt.getTime() <= now.getTime(),
      );
      if (!row) return null;
      const update = await decide(toCandidate(data, row));
      Object.assign(row, {
        status: update.status,
        attempts: update.attempts,
        nextAttemptAt: update.nextAttemptAt ?? row.nextAttemptAt,
        acceptedAt: update.acceptedAt,
        lastError: update.lastError,
      });
      if (update.removeDevice) data.devices = data.devices.filter((d) => d.id !== row.deviceId);
      return update;
    },
  };
  return Object.assign(repository, { fanOutCalls: () => fanOutCalls });
}
