import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import type { ProfileListItem, ProfileSession } from '@src/features/profiles/application/ports';
import { ProfileSwitcher } from './ProfileSwitcher';
import { TodayDoses } from './TodayDoses';
import { TodaySelf } from './TodaySelf';

type Props = { session: ProfileSession; profiles: ProfileListItem[] };

export function TodayProfiles({ session, profiles }: Props) {
  const [selection, setSelection] = useState<string | null>(null);
  const ownId = session.account.healthProfileId;
  const selectedId = selection ?? ownId;
  const profile = profiles.find((item) => item.id === selectedId && item.familyId === session.family?.id);
  const own = ownId && selectedId === ownId;
  return (
    <>
      <ProfileSwitcher profiles={profiles} selectedId={selectedId} onSelect={setSelection} />
      {own ? (
        <TodaySelf key={ownId} session={session} />
      ) : profile ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-[22px] leading-[30px] font-semibold break-words">{profile.displayName}</h2>
          <TodayDoses key={profile.id} session={session} target={{ kind: 'profile', profile }} />
        </section>
      ) : (
        <div className="flex flex-col items-start gap-4">
          <p>{profiles.length ? 'Chọn hồ sơ để xem liều hôm nay.' : 'Chưa có hồ sơ nào.'}</p>
          <Link
            to="/"
            search={{ view: 'profiles' }}
            className="inline-flex min-h-12 items-center rounded-xl border border-border px-4 font-semibold"
          >
            Hồ sơ gia đình
          </Link>
        </div>
      )}
    </>
  );
}
