import type { MyConsentRepository } from '../../application/myConsentPorts';
import type { ProfileSession } from '../../application/ports';
import { useMyConsent } from '../../application/useMyConsent';
import { MyConsentCard } from './MyConsentCard';
import { WithdrawConsentDialog } from './WithdrawConsentDialog';
// Người chăm sóc chính rút từ thẻ hồ sơ của mình (showCard=false); thành viên không có lưới hồ sơ nên vẫn thấy thẻ riêng.
export function MyConsentSection({
  repository,
  session,
  open,
  setOpen,
  showCard,
}: {
  repository: MyConsentRepository;
  session: ProfileSession;
  open: boolean;
  setOpen: (open: boolean) => void;
  showCard: boolean;
}) {
  const { consent, withdraw } = useMyConsent(repository, session);
  const profile = consent.data?.profile ?? null;
  if (!profile) return null;
  const close = () => {
    setOpen(false);
    withdraw.reset();
  };
  return (
    <>
      {showCard && <MyConsentCard profile={profile} onWithdraw={() => setOpen(true)} />}
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
