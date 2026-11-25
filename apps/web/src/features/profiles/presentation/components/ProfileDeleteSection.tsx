import { useState } from 'react';
import { AdminIcon } from '@src/features/family/presentation/components/AdminIcon';
import type { ProfileListItem, ProfileSession } from '../../application/ports';
import { createProfilesRepository } from '../../infrastructure/createProfilesRepository';
import { DeleteProfileDialog } from './DeleteProfileDialog';

const repository = createProfilesRepository();

export function ProfileDeleteSection({
  profile,
  session,
}: {
  profile: ProfileListItem;
  session: ProfileSession;
}) {
  const [deleting, setDeleting] = useState(false);
  return (
    <>
      <section
        className="flex flex-col justify-between gap-3 rounded-[22px] border border-danger/25 bg-surface p-4 sm:flex-row sm:items-center md:px-6"
        aria-labelledby="profile-delete-title"
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            aria-hidden="true"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-danger-soft text-danger"
          >
            <AdminIcon name="delete_outline" size={22} />
          </span>
          <h2 id="profile-delete-title" className="text-body font-semibold text-text-primary">
            Xóa hồ sơ
          </h2>
        </div>
        <button
          type="button"
          onClick={() => setDeleting(true)}
          className="inline-flex min-h-btn shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-danger/60 px-5 text-button-secondary font-semibold text-danger transition-colors hover:bg-danger-soft"
        >
          <AdminIcon name="delete_outline" size={18} />
          Xóa hồ sơ…
        </button>
      </section>
      {deleting && (
        <DeleteProfileDialog
          profile={profile}
          repository={repository}
          session={session}
          onClose={() => setDeleting(false)}
        />
      )}
    </>
  );
}
