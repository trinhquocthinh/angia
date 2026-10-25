import { resolveReminderRecipients } from '@src/features/reminders/domain/resolveReminderRecipients.js';
import type { MyReminderActor, MyReminderOutcome, MyReminderRepository } from './ports.js';

// Mọi chuỗi PostgreSQL chấp nhận là uuid; chuỗi khác trả 404 như ID không tồn tại (không lộ khác biệt).
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const NOT_FOUND: MyReminderOutcome = { ok: false, code: 'ERR_NOT_FOUND' };

// SPEC-035: tài khoản phiên chỉ đọc được lời nhắc khi hồ sơ đã đồng thuận và mình là người nhận hợp lệ
// hiện hành (BR-039); mọi trường hợp khác đồng nhất ERR_NOT_FOUND.
export async function getMyReminder(
  repository: MyReminderRepository,
  actor: MyReminderActor,
  reminderId: string,
): Promise<MyReminderOutcome> {
  if (!UUID_PATTERN.test(reminderId)) return NOT_FOUND;
  const loaded = await repository.load(actor.familyId, reminderId);
  if (!loaded?.reminder.consentConfirmed) return NOT_FOUND;
  const { id, date, slot, scheduledAt, profileName, profileId, medications } = loaded.reminder;
  const { recipients } = resolveReminderRecipients(
    profileId,
    loaded.familyAccounts,
    loaded.assignedAccountIds,
  );
  if (!recipients.some((r) => r.accountId === actor.accountId)) return NOT_FOUND;
  return {
    ok: true,
    value: {
      id,
      date,
      slot,
      scheduledAt,
      profileName,
      medications: medications.map((m) => ({
        name: m.name,
        strength: m.strength ?? null,
        quantityPerDose: m.quantityPerDose ?? null,
        doseUnit: m.doseUnit ?? null,
      })),
    },
  };
}
