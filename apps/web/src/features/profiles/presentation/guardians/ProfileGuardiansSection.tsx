import type { ProfileListItem, ProfileSession } from '../../application/ports';
import type { ProfileGuardiansRepository } from '../../application/guardianPorts';
import { useProfileGuardiansController } from './useProfileGuardiansController';
import { createProfileGuardiansRepository } from '../../infrastructure/createProfileGuardiansRepository';
import { AddGuardianDialog } from './AddGuardianDialog';
import { GuardianToast } from './GuardianToast';
import { GuardiansSectionContent } from './GuardiansSectionContent';
import { RemoveSelfGuardianDialog } from './RemoveSelfGuardianDialog';
import './profile-guardians.css';
import './profile-guardian-dialogs.css';

const defaultRepository = createProfileGuardiansRepository();

type Props = {
  profile: ProfileListItem;
  session: ProfileSession;
  repository?: ProfileGuardiansRepository;
};

export function ProfileGuardiansSection({ profile, session, repository = defaultRepository }: Props) {
  const { visible, dialog, dialogError, toast, model, guardians, candidates, openDialog, submit } =
    useProfileGuardiansController(profile, session, repository);
  if (!visible) return null;

  return (
    <section data-modal-return-focus tabIndex={-1} aria-label="Người giám hộ" className="flex flex-col gap-3">
      <GuardiansSectionContent
        profileName={profile.displayName}
        guardians={guardians}
        isPending={model.guardiansQuery.isPending}
        errorMessage={model.guardiansQuery.isError ? model.guardiansQuery.error.message : null}
        onRetry={() => void model.guardiansQuery.refetch()}
        onOpenAdd={() => openDialog('add')}
        onOpenRemoveSelf={() => openDialog('remove')}
      />
      {dialog === 'add' && (
        <AddGuardianDialog
          profileName={profile.displayName}
          candidates={candidates}
          loading={model.candidatesQuery.isPending}
          loadError={model.candidatesQuery.isError}
          pending={model.adding}
          submitError={dialogError}
          onRetryLoad={() => void model.candidatesQuery.refetch()}
          onClose={() => openDialog('none')}
          onSubmit={(id) => void submit(() => model.addGuardian(id), 'Đã thêm người giám hộ')}
        />
      )}
      {dialog === 'remove' && (
        <RemoveSelfGuardianDialog
          profileName={profile.displayName}
          pending={model.removing}
          error={dialogError}
          onClose={() => openDialog('none')}
          onConfirm={() => void submit(() => model.removeSelf(), 'Đã tự gỡ')}
        />
      )}
      <GuardianToast message={toast.message} sequence={toast.sequence} />
    </section>
  );
}
