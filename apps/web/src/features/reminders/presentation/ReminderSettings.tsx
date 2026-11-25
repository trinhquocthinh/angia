import { Link } from '@tanstack/react-router';
import { canManageProfileGuardians } from '@src/features/profiles/application/canManageProfileGuardians';
import { createDoseSlotRepository } from '../infrastructure/createDoseSlotRepository';
import { DoseSlotSettingsForm } from './DoseSlotSettingsForm';
import { MinorReminderRecipientsNotice } from './MinorReminderRecipientsNotice';
import { ReminderRecipientsSection } from './ReminderRecipientsSection';
import type { ProfileListItem, ProfileSession } from '@src/features/profiles/application/ports';
import { useReminderSetting } from '../application/useReminderSetting';
import { ReminderSettingSection } from './ReminderSettingSection';

const doseSlots = createDoseSlotRepository();
const doseSlotIo = { load: doseSlots.get, store: doseSlots.save };

export function ReminderSettings({
  profile,
  session,
}: {
  profile: ProfileListItem;
  session: ProfileSession;
}) {
  const slots = useReminderSetting('dose-slots', doseSlotIo, session, profile);
  const showGuardians = canManageProfileGuardians(profile, session);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          to="/profiles/$profileId/medications"
          params={{ profileId: profile.id }}
          className="min-h-12 self-start content-center text-button-secondary font-semibold text-accent"
        >
          ← Thuốc điều trị của {profile.displayName}
        </Link>
        <h1 className="auth-heading text-heading-1 font-semibold tracking-tight text-text-primary">
          Nhắc thuốc
        </h1>
      </div>
      {profile.consentStatus !== 'confirmed' ? (
        <p role="alert" className="rounded-[20px] bg-surface p-6 text-body">
          Hồ sơ chưa được đồng ý lưu dữ liệu.
        </p>
      ) : (
        <>
          <ReminderSettingSection
            title="Khung giờ nhắc"
            query={slots.query}
            loadingText="Đang tải khung giờ nhắc…"
          >
            {(saved) => (
              <DoseSlotSettingsForm
                saved={saved}
                pending={slots.save.isPending}
                serverError={slots.save.error?.message ?? null}
                done={slots.save.isSuccess}
                onSubmit={(value) => slots.save.mutate(value)}
              />
            )}
          </ReminderSettingSection>
          {showGuardians ? (
            <MinorReminderRecipientsNotice profileId={profile.id} />
          ) : (
            <ReminderRecipientsSection profile={profile} session={session} />
          )}
        </>
      )}
    </div>
  );
}
