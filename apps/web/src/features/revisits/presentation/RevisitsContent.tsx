import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { ProfileHealthHeader } from '@src/features/measurements/presentation/components/ProfileHealthHeader';
import { RevisitSchedule } from './RevisitSchedule';

export function RevisitsContent({ profile, session }: { profile: HealthProfile; session: ProfileSession }) {
  return (
    <div className="flex flex-col gap-6">
      <ProfileHealthHeader profile={profile} session={session} active="revisits" />
      <div className="rounded-[20px] bg-white p-5">
        <h2 className="text-lg font-semibold text-[#004135]">Lịch tái khám</h2>
        <p className="mt-2 text-sm text-[#55615f]">
          Ngày hẹn ghi trên đơn thuốc, từ hôm nay trở đi. Các đơn hẹn cùng ngày được hiển thị chung.
        </p>
      </div>
      <RevisitSchedule profile={profile} session={session} />
    </div>
  );
}
