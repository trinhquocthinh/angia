import type { PainIssueSummary } from '@angia/contracts';
import { PainIssueCard } from '../PainIssueCard/PainIssueCard';
import type { PainJournalActions } from './painJournalActions';

type Props = PainJournalActions & { issues: PainIssueSummary[] };

export function PainIssueGroups({ issues, onCreate, onOpen, onRecord }: Props) {
  const tracking = issues.filter((issue) => issue.status === 'tracking');
  const resolved = issues.filter((issue) => issue.status === 'resolved');
  return (
    <>
      {issues.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border/60 bg-bg px-6 py-10 text-center text-caption text-text-secondary">
          <p className="text-body font-semibold text-text-primary">Chưa ghi nhận đau nhức nào.</p>
          <p className="max-w-md">Khi có chỗ đau muốn theo dõi, chọn vị trí trên hình rồi chấm mức.</p>
        </div>
      ) : (
        <section aria-label="Đang theo dõi" className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-body font-semibold text-text-primary">Đang theo dõi</h3>
            <span className="rounded-full bg-secondary-container px-3 py-0.5 text-caption font-semibold text-on-secondary-container tabular-nums">
              {tracking.length}
            </span>
          </div>
          {tracking.length === 0 && (
            <p className="text-caption text-text-secondary">Không có vấn đề nào đang theo dõi.</p>
          )}
          <div className="grid gap-3.5 md:grid-cols-2">
            {tracking.map((issue) => (
              <PainIssueCard key={issue.id} issue={issue} onOpen={onOpen} onRecord={onRecord} />
            ))}
          </div>
        </section>
      )}
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex min-h-btn w-full cursor-pointer items-center justify-center rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover lg:hidden"
        >
          Thêm vấn đề đau
        </button>
      )}
      {resolved.length > 0 && (
        <details
          key={tracking.length === 0 ? 'expanded' : 'collapsed'}
          open={tracking.length === 0}
          className="rounded-2xl border border-border/35 bg-bg p-4"
        >
          <summary className="min-h-btn flex cursor-pointer items-center justify-between text-body font-semibold text-text-primary">
            <span>Đã khỏi</span>
            <span className="rounded-full bg-surface px-2.5 py-0.5 text-caption font-semibold text-text-secondary tabular-nums">
              {resolved.length}
            </span>
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            {resolved.map((issue) => (
              <PainIssueCard key={issue.id} issue={issue} onOpen={onOpen} />
            ))}
          </div>
        </details>
      )}
    </>
  );
}
