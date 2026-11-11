import type { ProfileSession } from '@src/features/profiles/application/ports';
import { useSelfProfile } from '@src/features/selfProfile/application/useSelfProfile';
import { selfProfileRepository } from '@src/features/selfProfile/presentation/selfProfileRepository';
import { Button } from '@src/shared/ui/button/Button';
import { TodayDoses } from './TodayDoses';

export function TodaySelf({ session }: { session: ProfileSession }) {
  const query = useSelfProfile(selfProfileRepository, session);
  if (query.isError)
    return (
      <div role="alert" className="flex flex-col items-start gap-4">
        <p>Không thể tải hồ sơ của bạn.</p>
        <Button variant="secondary" onClick={() => void query.refetch()}>
          Thử lại
        </Button>
      </div>
    );
  if (!query.data) return <p role="status">Đang tải hồ sơ của bạn…</p>;
  if (query.data.id !== session.account.healthProfileId)
    return <p role="alert">Tài khoản chưa liên kết hồ sơ sức khỏe.</p>;
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-[22px] leading-[30px] font-semibold break-words">{query.data.displayName}</h2>
      <TodayDoses key={query.data.id} session={session} target={{ kind: 'self', profile: query.data }} />
    </section>
  );
}
