import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { PainIssueSummary } from '@angia/contracts';
import type { PainJournalActions } from './painJournalActions';
import { PainIssueGroups } from './PainIssueGroups';
import { PainJournalStatus } from './PainJournalStatus';

type Props = PainJournalActions & {
  issues: PainIssueSummary[] | undefined;
  error: Error | null;
  retry: () => void;
  consentConfirmed?: boolean;
};
export function PainJournalTab({ issues, error, retry, consentConfirmed = true, ...actions }: Props) {
  if (!consentConfirmed || (error instanceof MedicationRequestError && error.code === 'ERR_CONSENT_REQUIRED'))
    return <p role="alert">Hồ sơ chưa được đồng ý lưu dữ liệu.</p>;
  return (
    <section aria-label="Đau nhức" className="flex min-w-0 flex-col gap-4 rounded-xl bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-[#004135]">Đau nhức</h2>
        {actions.onCreate && (
          <button
            type="button"
            onClick={actions.onCreate}
            className="hidden min-h-[52px] rounded-xl bg-[#286958] px-5 font-medium text-white lg:block"
          >
            Thêm vấn đề đau
          </button>
        )}
      </header>
      {error || !issues ? (
        <PainJournalStatus error={error} retry={retry} />
      ) : (
        <PainIssueGroups issues={issues} {...actions} />
      )}
    </section>
  );
}
