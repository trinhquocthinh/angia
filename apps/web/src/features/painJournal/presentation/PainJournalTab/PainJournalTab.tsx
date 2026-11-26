import { MedicationRequestError } from '@src/features/medications/application/MedicationRequestError';
import type { PainIssueSummary } from '@angia/contracts';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
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
    return (
      <p role="alert" className="profile-bento-card p-6 text-body">
        Hồ sơ chưa được đồng ý lưu dữ liệu.
      </p>
    );
  return (
    <section aria-label="Đau nhức" className="profile-bento-card flex min-w-0 flex-col gap-5 p-5 lg:p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft">
            <ProfileSectionIcon name="accessibility_new" size={32} />
          </span>
          <div>
            <h2 className="auth-heading text-heading-2 font-semibold text-accent">Đau nhức</h2>
            <p className="text-caption text-text-secondary">
              Theo dõi vị trí đau, mức ghi nhận và bài tập kèm theo.
            </p>
          </div>
        </div>
        {actions.onCreate && (
          <button
            type="button"
            onClick={actions.onCreate}
            className="hidden min-h-btn cursor-pointer items-center gap-1.5 rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover lg:inline-flex"
          >
            + Thêm vấn đề đau
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
