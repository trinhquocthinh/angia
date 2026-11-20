import { useState } from 'react';
import type { ProfileListItem, ProfileSession } from '../../application/ports';
import type { ProfileGuardiansRepository } from '../../application/guardianPorts';
import { canManageProfileGuardians } from '../../application/canManageProfileGuardians';
import { filterGuardianCandidates } from '../../application/guardianRules';
import { useProfileGuardians } from '../../application/useProfileGuardians';

type DialogMode = 'none' | 'add' | 'remove';

export function useProfileGuardiansController(
  profile: ProfileListItem,
  session: ProfileSession,
  repository: ProfileGuardiansRepository,
) {
  const visible = canManageProfileGuardians(profile, session);
  const [dialog, setDialog] = useState<DialogMode>('none');
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [toast, setToast] = useState({ message: '', sequence: 0 });
  const model = useProfileGuardians(repository, session, profile.id, visible, dialog === 'add');

  const guardians = model.guardiansQuery.data ?? [];
  const candidates = filterGuardianCandidates(model.candidatesQuery.data ?? [], guardians);
  const openDialog = (mode: DialogMode) => {
    setDialogError(null);
    setDialog(mode);
  };
  const submit = async (
    run: () => Promise<{ ok: true } | { ok: false; message: string }>,
    okText: string,
  ) => {
    setDialogError(null);
    const outcome = await run();
    if (!outcome.ok) return setDialogError(outcome.message);
    openDialog('none');
    setToast((prev) => ({ message: okText, sequence: prev.sequence + 1 }));
  };

  return { visible, dialog, dialogError, toast, model, guardians, candidates, openDialog, submit };
}
