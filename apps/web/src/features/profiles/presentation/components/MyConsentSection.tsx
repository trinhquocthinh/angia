import { useState } from 'react';
import type { MyConsentRepository } from '../../application/myConsentPorts';
import type { ProfileSession } from '../../application/ports';
import { useMyConsent } from '../../application/useMyConsent';
import { MyConsentCard } from './MyConsentCard';
import { WithdrawConsentDialog } from './WithdrawConsentDialog';
export function MyConsentSection({
  repository,
  session,
}: {
  repository: MyConsentRepository;
  session: ProfileSession;
}) {
  const { consent, withdraw } = useMyConsent(repository, session);
  const [open, setOpen] = useState(false);
  const profile = consent.data?.profile ?? null;
  if (!profile) return null;
  const close = () => {
    setOpen(false);
    withdraw.reset();
  };
  return (
    <>
      <MyConsentCard profile={profile} onWithdraw={() => setOpen(true)} />
      {open && (
        <WithdrawConsentDialog
          name={profile.displayName}
          pending={withdraw.isPending}
          failure={withdraw.error?.message ?? null}
          onConfirm={() => withdraw.mutate(undefined, { onSuccess: close })}
          onCancel={close}
        />
      )}
    </>
  );
}
