import { Link } from '@tanstack/react-router';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { ProfileSectionPage } from '@src/features/profiles/presentation/components/ProfileSectionPage';
import { useDoseSlots } from '../application/useDoseSlots';
import { createDoseSlotRepository } from '../infrastructure/createDoseSlotRepository';
import { DoseSlotSettingsForm } from './DoseSlotSettingsForm';

const repository = createDoseSlotRepository();

// E9-S1-T1: trang /profiles/:id/reminders — cấu hình khung giờ buổi của hồ sơ (SPEC-025, BR-036).
export function DoseSlotsPage({ profileId }: { profileId: string }) {
  return (
    <ProfileSectionPage profileId={profileId}>
      {(profile, session) => <DoseSlotsContent profile={profile} session={session} />}
    </ProfileSectionPage>
  );
}

function DoseSlotsContent({ profile, session }: { profile: HealthProfile; session: ProfileSession }) {
  const { slots, save } = useDoseSlots(repository, session, profile);
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
        <h1 className="auth-heading text-2xl font-semibold tracking-tight text-[#131d1d]">
          Khung giờ nhắc thuốc
        </h1>
      </div>
      {profile.consentStatus !== 'confirmed' ? (
        <p role="alert" className="rounded-[20px] bg-white p-6 text-sm">
          Hồ sơ chưa được đồng ý lưu dữ liệu.
        </p>
      ) : slots.isPending ? (
        <p className="rounded-xl bg-white p-6 text-sm text-[#404945]">Đang tải khung giờ nhắc…</p>
      ) : slots.isError ? (
        <p role="alert" className="rounded-xl bg-white p-6 text-sm">
          {slots.error.message}{' '}
          <button
            type="button"
            className="font-semibold text-[#286958] underline"
            onClick={() => void slots.refetch()}
          >
            Thử lại
          </button>
        </p>
      ) : (
        <DoseSlotSettingsForm
          saved={slots.data}
          pending={save.isPending}
          serverError={save.error?.message ?? null}
          done={save.isSuccess}
          onSubmit={(value) => save.mutate(value)}
        />
      )}
    </div>
  );
}
