import type { TimelineEvent } from '@angia/contracts';

type Data = Extract<TimelineEvent, { kind: 'lab_result' }>['data'];

export function TimelineLabResults({ data }: { data: Data }) {
  return (
    <>
      {data.facility && <p className="font-medium text-text-secondary">Nơi xét nghiệm: {data.facility}</p>}
      <ul className="space-y-2">
        {data.results.map((result) => (
          <li key={result.id} className="rounded-xl border border-border/30 bg-bg px-3.5 py-2.5">
            <p className="text-body text-text-primary tabular-nums">
              <span className="font-semibold">{result.testName}</span>: {result.value}
              {result.unit ? ` ${result.unit}` : ''}
            </p>
            {result.referenceRange && (
              <p className="mt-0.5 text-caption text-text-secondary tabular-nums">
                Khoảng tham chiếu trên phiếu: {result.referenceRange}
              </p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
