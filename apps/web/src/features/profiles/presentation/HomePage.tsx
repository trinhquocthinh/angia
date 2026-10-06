import { RecipientNotice } from './components/RecipientNotice';
import { useProfileSessionRecovery } from '../application/useProfileSessionRecovery';
import { useState } from 'react';
import { Link } from '@tanstack/react-router';
import { useCurrentSession } from '@src/features/auth/application/useCurrentSession';
import { fetchCurrentSession } from '@src/features/auth/infrastructure/fetchCurrentSession';
import { useProfilesWorkspace } from '../application/useProfilesWorkspace';
import type { HealthProfile } from '../application/ports';
import { createProfilesRepository } from '../infrastructure/createProfilesRepository';
import { ProfileFrame } from './components/ProfileFrame';
import { ProfilesContent } from './components/ProfilesContent';
import { ConsentDialog } from './components/ConsentDialog';
import './profiles.css';
const repository = createProfilesRepository();
export function HomePage() {
  const session = useCurrentSession(fetchCurrentSession);
  const workspace = useProfilesWorkspace(repository, session.data);
  const [selected, setSelected] = useState<HealthProfile | null>(null);
  useProfileSessionRecovery(
    workspace.profiles.error ?? workspace.accounts.error ?? workspace.create.error ?? workspace.consent.error,
  );
  if (!session.data) return null;
  const profiles = workspace.profiles.data ?? [];
  const main = session.data.role === 'main';
  return (
    <ProfileFrame session={session.data} profiles={main ? profiles : []} logout={workspace.logout}>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-5">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="auth-heading text-[32px] font-semibold leading-tight text-[#004135]">Gia đình</h1>
            <span className="max-w-full break-words rounded-full bg-[#c8f5e9] px-3 py-1 text-sm font-medium text-[#286958]">
              {session.data.family?.name}
            </span>
          </div>
          <p className="mt-3 text-sm text-[#55615f]">
            {main && workspace.profiles.isSuccess
              ? `${profiles.length} hồ sơ thành viên`
              : 'Sổ sức khỏe gia đình'}
          </p>
        </div>
        {main && (
          <Link
            to="/profiles/new"
            className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[#004135] px-5 py-3 text-center text-sm font-semibold text-white cursor-pointer disabled:opacity-55 disabled:cursor-default focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#286958]"
          >
            + Tạo hồ sơ
          </Link>
        )}
      </div>
      {main ? (
        <ProfilesContent
          profiles={profiles}
          loading={workspace.profiles.isPending}
          error={workspace.profiles.isError}
          retry={() => void workspace.profiles.refetch()}
          onConsent={setSelected}
        />
      ) : (
        <RecipientNotice />
      )}
      {selected && selected.familyId === session.data.family?.id && main && (
        <ConsentDialog
          key={selected.id}
          profile={selected}
          pending={workspace.consent.isPending}
          onConfirm={(confirmedBy) => workspace.consent.mutateAsync({ id: selected.id, confirmedBy })}
          onClose={() => setSelected(null)}
        />
      )}
    </ProfileFrame>
  );
}
