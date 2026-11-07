import { useId, useState } from 'react';
import type { PainIssueDetail } from '@angia/contracts';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { seriesRange, type WeekSpan } from '@src/features/measurements/application/seriesRange';
import { SegmentedToggle } from '@src/features/measurements/presentation/components/SegmentedToggle';
import type { PainContextReader } from '../../application/ports';
import { usePainContext } from '../../application/usePainContext';
import { describeBodyLocation } from '../BodyMap2D/describeBodyLocation';
import { PainChartContent } from './PainChartContent';
const OPTIONS = [
  { value: 4, label: '4 tuần' },
  { value: 12, label: '12 tuần' },
  { value: 26, label: '26 tuần' },
] as const;

export function PainIssueChart({
  api,
  session,
  profile,
  scope,
  issue,
}: {
  api: PainContextReader;
  session: ProfileSession;
  profile: HealthProfile;
  scope: 'main' | 'self';
  issue: PainIssueDetail;
}) {
  const id = useId();
  const [weeks, setWeeks] = useState<WeekSpan>(12);
  const range = seriesRange(weeks);
  const query = usePainContext(api, session, profile, scope, issue.id, range);
  return (
    <section
      aria-labelledby={id}
      className="min-w-0 space-y-4 rounded-xl border border-[#E4E0DA] bg-white p-4 md:p-6"
    >
      <h2 id={id} className="text-lg font-semibold">
        Mức đau trong {weeks} tuần
      </h2>
      <SegmentedToggle
        label="Khoảng thời gian biểu đồ đau"
        value={weeks}
        options={OPTIONS}
        onChange={setWeeks}
      />
      <PainChartContent
        entries={issue.entries}
        range={range}
        weeks={weeks}
        location={describeBodyLocation(issue)}
        context={query.data}
      />
      {query.isPending && <p role="status">Đang tải bối cảnh thuốc…</p>}
      {query.isError && (
        <div role="alert">
          <p>Không thể tải bối cảnh thuốc.</p>
          <button type="button" className="min-h-11 underline" onClick={() => void query.refetch()}>
            Thử lại bối cảnh thuốc
          </button>
        </div>
      )}
    </section>
  );
}
