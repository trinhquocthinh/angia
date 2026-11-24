import type { components } from '@src/shared/api/schema.gen';
import { buildExportProfileOptions } from '@src/features/account/application/exportProfileOptions';
import type { ExportableProfile } from '@src/features/account/application/ports';
import { useAccountDeletion } from '@src/features/account/application/useAccountDeletion';
import { useDataExport } from '@src/features/account/application/useDataExport';
import { fetchDataExportStatus } from '@src/features/account/infrastructure/fetchDataExportStatus';
import { submitAccountDeletion } from '@src/features/account/infrastructure/submitAccountDeletion';
import { submitDataExportRequest } from '@src/features/account/infrastructure/submitDataExportRequest';
import { AccountDataExportCard } from '@src/features/account/presentation/settings/AccountDataExportCard';
import { AccountDeleteCard } from '@src/features/account/presentation/settings/AccountDeleteCard';

type Props = {
  session: components['schemas']['MeContextResponse'];
  profiles: readonly ExportableProfile[];
  onAccountDeleted: () => Promise<void> | void;
};

export function AccountDataDeleteSection({ session, profiles, onAccountDeleted }: Props) {
  const exportOptions = buildExportProfileOptions(profiles, Boolean(session.family?.isOwner));
  const dataExport = useDataExport({
    csrfToken: session.csrfToken,
    createExport: submitDataExportRequest,
    fetchStatus: fetchDataExportStatus,
  });
  const deletion = useAccountDeletion({
    csrfToken: session.csrfToken,
    hasLinkedProfile: session.account.healthProfileId !== null,
    submitDeletion: submitAccountDeletion,
    onDeleted: onAccountDeleted,
  });

  return (
    <>
      <AccountDataExportCard
        phase={dataExport.phase}
        options={exportOptions}
        selectedScope={dataExport.selectedScope}
        actionLabel={dataExport.actionLabel}
        downloadUrl={dataExport.downloadUrl}
        onSelectScope={dataExport.selectScope}
        onStartExport={() => void dataExport.startExport()}
      />
      {session.hasLocalCredential && (
        <AccountDeleteCard
          hasLinkedProfile={session.account.healthProfileId !== null}
          open={deletion.open}
          password={deletion.password}
          disposition={deletion.disposition}
          pending={deletion.pending}
          canSubmit={deletion.canSubmit}
          error={deletion.error}
          errorCode={deletion.errorCode}
          onOpen={deletion.openDialog}
          onClose={deletion.closeDialog}
          onPasswordChange={deletion.setPassword}
          onDispositionChange={deletion.setDisposition}
          onSubmit={() => void deletion.submit()}
        />
      )}
    </>
  );
}
