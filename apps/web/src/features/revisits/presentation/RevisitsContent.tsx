import type { ProfileListItem, ProfileSession } from '@src/features/profiles/application/ports';
import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
import { RevisitSchedule } from './RevisitSchedule';

export function RevisitsContent({ profile, session }: { profile: ProfileListItem; session: ProfileSession }) {
  return (
    <div className="flex min-w-0 flex-col gap-6">
      <ProfileHealthHeader profile={profile} session={session} active="revisits" />
      <section className="profile-bento-card flex items-start gap-4 p-5 sm:p-6">
        <ProfileSectionIcon name="event" size={44} />
        <div className="min-w-0">
          <h2 className="auth-heading text-heading-2 font-semibold text-accent">Lịch tái khám</h2>
          <p className="mt-1 text-caption text-text-secondary">
            Ngày hẹn ghi trên đơn thuốc, từ hôm nay trở đi. Các đơn hẹn cùng ngày được hiển thị chung.
          </p>
        </div>
      </section>
      <RevisitSchedule profile={profile} session={session} />
    </div>
  );
}
