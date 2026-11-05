import { useState } from 'react';
import type { MyConsentRepository } from '../../application/myConsentPorts';
import type { ProfileSession } from '../../application/ports';
import { useMyConsent } from '../../application/useMyConsent';
import { MyConsentCard } from './MyConsentCard';
import { UnlinkProfileDialog } from './UnlinkProfileDialog';
import { WithdrawConsentDialog } from './WithdrawConsentDialog';
// Thẻ hồ sơ liên kết dùng cho cả main/member để chính chủ luôn có lối tự gỡ liên kết.
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
  const { consent, withdraw, unlink } = useMyConsent(repository, session);
  const [unlinking, setUnlinking] = useState(false);
  // Query bị tắt sau khi gỡ vẫn giữ dữ liệu cũ; phiên mới là căn cứ.
  const profile = session.account.healthProfileId ? (consent.data?.profile ?? null) : null;
  if (!profile) return null;
  const close = () => {
    setOpen(false);
    withdraw.reset();
  };
  return (
    <>
      {showCard && (
        <MyConsentCard
          profile={profile}
          onWithdraw={() => setOpen(true)}
          onUnlink={() => setUnlinking(true)}
        />
      )}
      {open && (
        <WithdrawConsentDialog
          name={profile.displayName}
          pending={withdraw.isPending}
          failure={withdraw.error?.message ?? null}
          onConfirm={() => withdraw.mutate(undefined, { onSuccess: close })}
          onCancel={close}
        />
      )}
      {unlinking && (
        <UnlinkProfileDialog
          name={profile.displayName}
          pending={unlink.isPending}
          failure={unlink.error?.message ?? null}
          onConfirm={() => unlink.mutate(undefined, { onSuccess: () => setUnlinking(false) })}
          onCancel={() => {
            setUnlinking(false);
            unlink.reset();
          }}
        />
      )}
    </>
  );
}
