import { DeleteHouseholdHeading } from './DeleteHouseholdHeading';
import { useState } from 'react';
import type { DeletionRequest } from '../../application/householdHomePorts';
import { HomeClayGlyph } from '../home/HomeClayGlyph';
import { DeleteHouseholdDialog } from './DeleteHouseholdDialog';
import { DeletePendingBanner } from './DeletePendingBanner';

type Props = {
  familyName: string;
  otherCount: number;
  pendingDeletion: DeletionRequest | null;
  pending: boolean;
  error: string | null;
  hideBanner?: boolean;
  onRequest: (confirmFamilyName: string) => Promise<boolean>;
  onRevoke: (requestId: string) => void;
  onClearError: () => void;
};

function renderActionButton(otherCount: number, disabled: boolean, onOpen: () => void) {
  if (otherCount > 0) {
    return (
      <button type="button" disabled className="household-delete-disabled-btn">
        <HomeClayGlyph name="home-trash-muted" size={20} />
        <span>Xoá nhà (Còn thành viên khác)</span>
      </button>
    );
  }
  return (
    <button type="button" className="household-home-danger-trigger" disabled={disabled} onClick={onOpen}>
      <HomeClayGlyph name="home-trash-light" size={20} />
      <span>Xoá nhà</span>
    </button>
  );
}

export function DeleteHouseholdSection(props: Props) {
  const { familyName, otherCount, pendingDeletion, pending, error, hideBanner } = props;
  const [dialogOpen, setDialogOpen] = useState(false);

  async function handleConfirm(confirmFamilyName: string) {
    if (await props.onRequest(confirmFamilyName)) setDialogOpen(false);
  }

  return (
    <section
      id="household-delete-section"
      className="household-home-block household-delete-block"
      aria-labelledby="household-delete-title"
    >
      <DeleteHouseholdHeading otherCount={otherCount} />
      {!hideBanner && pendingDeletion && (
        <DeletePendingBanner request={pendingDeletion} pending={pending} onRevoke={props.onRevoke} />
      )}
      {renderActionButton(otherCount, pending || Boolean(pendingDeletion), () => {
        props.onClearError();
        setDialogOpen(true);
      })}
      {!dialogOpen && error && (
        <p role="alert" className="household-home-error-alert">
          {error}
        </p>
      )}
      {dialogOpen && (
        <DeleteHouseholdDialog
          familyName={familyName}
          pending={pending}
          error={error}
          onClose={() => setDialogOpen(false)}
          onConfirm={(name) => void handleConfirm(name)}
        />
      )}
    </section>
  );
}
