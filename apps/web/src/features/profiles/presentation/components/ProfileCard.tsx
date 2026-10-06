import type { HealthProfile } from '../../application/ports';
export function ProfileCard({
  profile,
  onConsent,
}: {
  profile: HealthProfile;
  onConsent: (profile: HealthProfile) => void;
}) {
  const confirmed = Boolean(profile.consentConfirmedAt);
  return (
    <article className="flex min-h-[280px] flex-col rounded-[20px] bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <span
          className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#b3eddf] text-2xl font-semibold text-[#004135]"
          aria-hidden="true"
        >
          {profile.displayName.slice(0, 1)}
        </span>
        <div className="min-w-0">
          <h2 className="break-words text-xl font-semibold">{profile.displayName}</h2>
          {profile.birthYear !== null && (
            <p className="mt-1 text-sm text-[#55615f]">Năm sinh {profile.birthYear}</p>
          )}
        </div>
      </div>
      <div className="mt-6 flex-1 rounded-xl bg-[#eaf6f5] p-4">
        <p className="text-sm font-medium text-[#004135]">
          {confirmed ? 'Đã xác nhận đồng thuận' : 'Chưa xác nhận đồng thuận'}
        </p>
        <p className="mt-2 text-sm leading-6 text-[#55615f]">
          {confirmed
            ? 'Thông tin đồng thuận đã được ghi nhận.'
            : 'Xác nhận việc chia sẻ dữ liệu trước khi quản lý thông tin sức khỏe.'}
        </p>
      </div>
      {!confirmed && (
        <button
          className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#004135] px-5 py-3 text-center text-sm font-semibold text-white cursor-pointer disabled:opacity-55 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958] mt-5"
          onClick={() => onConsent(profile)}
        >
          Xác nhận đồng thuận
        </button>
      )}
    </article>
  );
}
