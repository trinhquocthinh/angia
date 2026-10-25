import { Link } from '@tanstack/react-router';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { ProfileSectionPage } from '@src/features/profiles/presentation/components/ProfileSectionPage';
import { useReminderSetting } from '../application/useReminderSetting';
import { createDoseSlotRepository } from '../infrastructure/createDoseSlotRepository';
import { createReminderRecipientRepository } from '../infrastructure/createReminderRecipientRepository';
import { DoseSlotSettingsForm } from './DoseSlotSettingsForm';
import { ReminderRecipientsForm } from './ReminderRecipientsForm';
import { ReminderSettingSection } from './ReminderSettingSection';

const doseSlots = createDoseSlotRepository();
const recipients = createReminderRecipientRepository();
const doseSlotIo = { load: doseSlots.get, store: doseSlots.save };
const recipientIo = { load: recipients.get, store: recipients.save };

// Trang /profiles/:id/reminders — khung giờ buổi (E9-S1-T1, SPEC-025) và người nhận nhắc (E9-S1-T2, SPEC-026).
export function DoseSlotsPage({ profileId }: { profileId: string }) {
  return (
    <ProfileSectionPage profileId={profileId}>
      {(profile, session) => <ReminderSettings profile={profile} session={session} />}
    </ProfileSectionPage>
  );
}

function ReminderSettings({ profile, session }: { profile: HealthProfile; session: ProfileSession }) {
  const slots = useReminderSetting('dose-slots', doseSlotIo, session, profile);
  const people = useReminderSetting('reminder-recipients', recipientIo, session, profile);
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <Link
          to="/profiles/$profileId/medications"
          params={{ profileId: profile.id }}
          className="min-h-11 self-start content-center text-sm font-semibold text-[#286958]"
        >
          ← Thuốc điều trị của {profile.displayName}
        </Link>
        <h1 className="auth-heading text-2xl font-semibold tracking-tight text-[#131d1d]">Nhắc thuốc</h1>
      </div>
      {profile.consentStatus !== 'confirmed' ? (
        <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
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
          <ReminderSettingSection
            title="Người nhận nhắc"
            query={people.query}
            loadingText="Đang tải người nhận nhắc…"
          >
            {(saved) => (
              <ReminderRecipientsForm
                saved={saved}
                pending={people.save.isPending}
                serverError={people.save.error?.message ?? null}
                done={people.save.isSuccess}
                onSubmit={(ids) => people.save.mutate(ids)}
              />
            )}
          </ReminderSettingSection>
        </>
      )}
    </div>
  );
}
