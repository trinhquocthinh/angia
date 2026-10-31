import type { TimelineEvent } from '@angia/contracts';

type Data = Extract<TimelineEvent, { kind: 'lab_result' }>['data'];

export function TimelineLabResults({ data }: { data: Data }) {
  return (
    <>
      {data.facility && <p>Nơi xét nghiệm: {data.facility}</p>}
      <ul className="space-y-3">
        {data.results.map((result) => (
          <li key={result.id}>
            <p>
              <span className="font-medium">{result.testName}</span>: {result.value}
              {result.unit ? ` ${result.unit}` : ''}
            </p>
            {result.referenceRange && (
              <p className="text-[#55615f]">Khoảng tham chiếu trên phiếu: {result.referenceRange}</p>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
