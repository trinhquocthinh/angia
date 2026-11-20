import { LeaveHouseholdHeading } from './LeaveHouseholdHeading';
import { useState } from 'react';
import type { OwnProfileDisposition } from '../../application/householdHomePorts';
import { HomeClayGlyph } from '../home/HomeClayGlyph';
import { LeaveHouseholdDialog } from './LeaveHouseholdDialog';
import { LeaveOwnerWarning } from './LeaveOwnerWarning';

type Props = {
  familyName: string;
  isOwner: boolean;
  otherCount: number;
  pending: boolean;
  error: string | null;
  errorCode: string | null;
  onLeave: (disposition: OwnProfileDisposition) => Promise<boolean>;
  onClearError: () => void;
  onScrollToDelete: () => void;
};

export function LeaveHouseholdSection(props: Props) {
  const { familyName, isOwner, otherCount, pending, error, errorCode } = props;
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleConfirm(disposition: OwnProfileDisposition) {
    if (await props.onLeave(disposition)) setDialogOpen(false);
  }

  return (
    <section className="household-home-block" aria-labelledby="household-leave-title">
      <LeaveHouseholdHeading familyName={familyName} isOwner={isOwner} otherCount={otherCount} />
      {isOwner && <LeaveOwnerWarning otherCount={otherCount} onScrollToDelete={props.onScrollToDelete} />}
      {isOwner ? (
        <button type="button" disabled className="household-home-disabled-btn">
          <HomeClayGlyph name="home-logout-muted" size={20} />
          <span>Rời nhà (Đang là Chủ hộ)</span>
        </button>
      ) : (
        <button
          type="button"
          className="household-home-danger-trigger"
          onClick={() => {
            props.onClearError();
            setDialogOpen(true);
          }}
        >
          <HomeClayGlyph name="home-logout-light" size={20} />
          <span>Rời nhà</span>
        </button>
      )}
      {dialogOpen && (
        <LeaveHouseholdDialog
          familyName={familyName}
          pending={pending}
          error={error}
          errorCode={errorCode}
          onClose={() => setDialogOpen(false)}
          onConfirm={(disposition) => void handleConfirm(disposition)}
          onGoToDelete={() => {
            setDialogOpen(false);
            props.onScrollToDelete();
          }}
        />
      )}
    </section>
  );
}
