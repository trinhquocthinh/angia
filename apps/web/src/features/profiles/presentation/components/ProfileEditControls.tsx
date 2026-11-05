import { useState } from 'react';
import type { HealthProfile, ProfileSession } from '../../application/ports';
import { createProfilesRepository } from '../../infrastructure/createProfilesRepository';
import { BirthYearReminder } from './BirthYearReminder';
import { EditProfileDialog } from './EditProfileDialog';
const repository = createProfilesRepository();
export function ProfileEditControls({
  profile,
  session,
}: {
  profile: HealthProfile;
  session: ProfileSession;
}) {
  const [opened, setOpened] = useState(false);
  if (
    session.role !== 'main' ||
    session.family?.id !== profile.familyId ||
    profile.consentStatus === 'withdrawn'
  )
    return null;
  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {profile.birthYear === null && <BirthYearReminder onEdit={() => setOpened(true)} />}
      <button
        type="button"
        onClick={() => setOpened(true)}
        className="min-h-11 cursor-pointer rounded-xl bg-white px-4 text-sm font-semibold text-[#004135] shadow-sm focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958]"
      >
        Sửa hồ sơ
      </button>
      {opened && (
        <EditProfileDialog
          key={profile.id}
          profile={profile}
          repository={repository}
          session={session}
          onClose={() => setOpened(false)}
        />
      )}
    </div>
  );
}
