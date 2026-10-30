import type { DailyReminder } from '../domain/DailyReminder.js';
import { planProfileReminders } from '../domain/planProfileReminders.js';
import type {
  FamilyReminderReport,
  GenerateRemindersResult,
  ReminderFamilyStore,
  ReminderRepository,
} from './ports.js';

// Chỉ mã lỗi (mã pg như 42501) — thông điệp có thể chứa dữ liệu dòng.
function errorReason(error: unknown): string {
  const { code, name } = (error ?? {}) as { code?: unknown; name?: unknown };
  return String(code ?? name ?? 'unknown');
}

async function generateForFamily(
  store: ReminderFamilyStore,
  familyId: string,
  date: string,
): Promise<FamilyReminderReport> {
  const report: FamilyReminderReport = {
    familyId,
    outcome: 'generated',
    created: 0,
    existing: 0,
    skippedProfiles: [],
    unscheduledSlots: [],
  };
  const accounts = await store.listFamilyAccounts();
  const reminders: DailyReminder[] = [];
  for (const profile of await store.listProfiles(date)) {
    const plan = planProfileReminders(profile, accounts, date);
    if (plan.outcome !== 'planned') {
      report.skippedProfiles.push({ profileId: profile.profileId, reason: plan.outcome });
      continue;
    }
    reminders.push(...plan.reminders);
    for (const slot of plan.unscheduledSlots)
      report.unscheduledSlots.push({ profileId: profile.profileId, slot });
  }
  report.created = reminders.length > 0 ? await store.insertReminders(reminders) : 0;
  report.existing = reminders.length - report.created;
  const revisits = await store.generateRevisitReminders(date);
  report.created += revisits.created;
  report.existing += revisits.existing;
  return report;
}

// SPEC-027/BR-037/BR-038: sinh lời nhắc ngày D cho mọi gia đình, mỗi gia đình một withFamilyScope.
// Idempotent nhờ khóa duy nhất (hồ sơ, ngày, buổi): chạy lại chỉ đếm vào `existing`.
// Lỗi của một gia đình không chặn gia đình khác; signal hủy dừng trước gia đình kế tiếp. Không ném lỗi.
export async function generateReminders(
  repository: ReminderRepository,
  date: string,
  signal?: AbortSignal,
): Promise<GenerateRemindersResult> {
  const families: FamilyReminderReport[] = [];
  let familyIds: string[] = [];
  let listError: string | undefined;
  try {
    familyIds = await repository.listFamilyIds();
  } catch (error) {
    listError = errorReason(error);
  }
  let aborted = false;
  for (const familyId of familyIds) {
    if (signal?.aborted) {
      aborted = true;
      break;
    }
    try {
      families.push(
        await repository.withFamily(familyId, (store) => generateForFamily(store, familyId, date)),
      );
    } catch (error) {
      families.push({
        familyId,
        outcome: 'error',
        created: 0,
        existing: 0,
        skippedProfiles: [],
        unscheduledSlots: [],
        reason: errorReason(error),
      });
    }
  }
  const sum = (field: 'created' | 'existing') => families.reduce((total, f) => total + f[field], 0);
  return {
    date,
    families,
    totals: {
      families: families.length,
      created: sum('created'),
      existing: sum('existing'),
      failedFamilies: families.filter((f) => f.outcome === 'error').length,
    },
    aborted,
    ...(listError ? { listError } : {}),
  };
}
