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
        <div className="flex flex-col gap-2 text-sm text-[#55615f]">
          <p>Chưa ghi nhận đau nhức nào.</p>
          <p>Khi có chỗ đau muốn theo dõi, chọn vị trí trên hình rồi chấm mức.</p>
        </div>
      ) : (
        <section aria-label="Đang theo dõi" className="flex flex-col gap-3">
          <h3 className="text-lg font-semibold text-[#131d1d]">Đang theo dõi</h3>
          {tracking.length === 0 && (
            <p className="text-sm text-[#55615f]">Không có vấn đề nào đang theo dõi.</p>
          )}
          {tracking.map((issue) => (
            <PainIssueCard key={issue.id} issue={issue} onOpen={onOpen} onRecord={onRecord} />
          ))}
        </section>
      )}
      {onCreate && (
        <button
          type="button"
          onClick={onCreate}
          className="min-h-[52px] w-full rounded-xl bg-[#286958] px-5 font-medium text-white lg:hidden"
        >
          Thêm vấn đề đau
        </button>
      )}
      {resolved.length > 0 && (
        <details
          key={tracking.length === 0 ? 'expanded' : 'collapsed'}
          open={tracking.length === 0}
          className="rounded-xl border border-[#dce5e1] p-4"
        >
          <summary className="min-h-11 cursor-pointer text-lg font-semibold text-[#131d1d]">Đã khỏi</summary>
          <div className="mt-3 flex flex-col gap-3">
            {resolved.map((issue) => (
              <PainIssueCard key={issue.id} issue={issue} onOpen={onOpen} />
            ))}
          </div>
        </details>
      )}
    </>
  );
}
