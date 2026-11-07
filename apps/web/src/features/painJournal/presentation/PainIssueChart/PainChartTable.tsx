import type { PainEntry } from '@angia/contracts';
import { formatPainEntryTime } from '../PainIssueDetail/formatPainEntryTime';
export function PainChartTable({
  entries,
  location,
  range,
}: {
  entries: PainEntry[];
  location: string;
  range: { from: string; to: string };
}) {
  const date = (day: string) => day.split('-').reverse().join('/');
  return (
    <div className="sr-only">
      <table>
        <caption>
          {location} từ {date(range.from)} đến {date(range.to)}: {entries.length} lần ghi.
        </caption>
        <thead>
          <tr>
            <th scope="col">Thời điểm</th>
            <th scope="col">Mức</th>
            <th scope="col">Ghi chú</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((entry) => (
            <tr key={entry.id}>
              <td>{formatPainEntryTime(entry.recordedAt)}</td>
              <td>{entry.level}/10</td>
              <td>{entry.note ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
