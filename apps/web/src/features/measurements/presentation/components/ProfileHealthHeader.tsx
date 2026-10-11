import { currentVietnamYear } from '@src/features/profiles/application/currentVietnamYear';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import { formatDay, readingText } from '../../application/formatMeasurement';
import type { Measurement } from '../../application/ports';
import { ManualEntryLink } from './ManualEntryLink';
import { ProfileTabs, type ProfileTabKey } from './ProfileTabs';

// Đầu trang hồ sơ (Stitch 718c9615): tên, tuổi theo năm sinh nếu có, chỉ số mới nhất, lối vào nhập tay không kèm ảnh
// (SPEC-011); tab Thuốc điều trị mở ở E4-S4-T1, các tab khác mở ở Epic sau. latest undefined: không hiện dòng chỉ số.
export function ProfileHealthHeader({
  profile,
  latest,
  active = 'health',
}: {
  profile: HealthProfile;
  latest?: Measurement | null;
  active?: ProfileTabKey;
}) {
  const age = profile.birthYear ? currentVietnamYear() - profile.birthYear : null;
  return (
    <section className="flex flex-col gap-6 rounded-[20px] bg-white p-5 lg:p-6">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#b3eddf] text-2xl font-semibold text-[#004135]"
        >
          {profile.displayName.slice(0, 1)}
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="auth-heading break-words text-2xl font-semibold text-[#004135] lg:text-[28px]">
              {profile.displayName}
            </h1>
            {age !== null && (
              <span className="rounded-full bg-[#e4f0ef] px-2.5 py-0.5 text-xs text-[#3f4946]">
                {age} tuổi
              </span>
            )}
          </div>
          {latest !== undefined && (
            <p className="text-sm text-[#55615f]">
              {latest ? (
                <>
                  Chỉ số mới nhất:{' '}
                  <strong className="tabular-nums text-[#131d1d]">{readingText(latest)}</strong> (
                  {formatDay(latest.measuredOn)}
                  {latest.measuredTime ? ` · ${latest.measuredTime}` : ''})
                </>
              ) : (
                'Chưa có số đo đã duyệt'
              )}
            </p>
          )}
        </div>
        <ManualEntryLink profileId={profile.id} />
      </div>
      <ProfileTabs profileId={profile.id} active={active} />
    </section>
  );
}
