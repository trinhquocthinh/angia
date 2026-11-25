import { useState } from 'react';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
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
    <div className="flex flex-wrap items-center gap-2.5">
      {profile.birthYear === null && <BirthYearReminder onEdit={() => setOpened(true)} />}
      <button
        type="button"
        onClick={() => setOpened(true)}
        className="inline-flex min-h-btn cursor-pointer items-center gap-2 rounded-2xl bg-accent-soft px-4 text-button-secondary font-semibold text-accent transition-colors hover:bg-choice-soft focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-focus"
      >
        <AdminIcon name="edit" size={18} />
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
