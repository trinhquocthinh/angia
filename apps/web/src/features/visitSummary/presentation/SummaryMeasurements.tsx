import { measurementPairs } from '../application/measurementPairs';
import type { SummaryMeasurementRow } from '../application/measurementRows';

/** Sức chứa cột số đo cạnh cột xét nghiệm như thiết kế (Design v0.1 §7); nhiều hơn thì chuyển chế độ nén. */
export const NARROW_CAPACITY = 24;

const HEADINGS = ['Ngày', 'HA (mmHg)', 'Mạch', 'Đường huyết'] as const;

// "Số đo trong khoảng": mỗi ô dòng một thời điểm (HA · Mạch · ĐH); đường huyết giữ đơn vị gốc (BR-020).
// Chế độ nén (owner chốt E6-S1-T2): toàn chiều ngang, chữ nhỏ, 2 thời điểm mỗi dòng; tràn thì sang trang kế,
// đầu bảng lặp lại.
export function SummaryMeasurements({ rows }: { rows: SummaryMeasurementRow[] }) {
  const wide = rows.length > NARROW_CAPACITY;
  return (
    <section className={wide ? 'summary-measurements--wide' : undefined}>
      <h3>Số đo trong khoảng</h3>
      {rows.length === 0 ? (
        <p className="summary-muted">Không có số đo đã duyệt trong khoảng này.</p>
      ) : (
        <table className="summary-table">
          <thead>
            <tr>
              {(wide ? [...HEADINGS, ...HEADINGS] : HEADINGS).map((heading, index) => (
                <th key={index} scope="col" className={index === 4 ? 'summary-pair-start' : undefined}>
                  {heading}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {wide
              ? measurementPairs(rows).map(([left, right]) => (
                  <tr key={left.key}>
                    <MeasurementCells row={left} />
                    {right ? (
                      <MeasurementCells row={right} paired />
                    ) : (
                      <td colSpan={4} className="summary-pair-start" />
                    )}
                  </tr>
                ))
              : rows.map((row) => (
                  <tr key={row.key}>
                    <MeasurementCells row={row} />
                  </tr>
                ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

function MeasurementCells({ row, paired = false }: { row: SummaryMeasurementRow; paired?: boolean }) {
  return (
    <>
      <td className={paired ? 'summary-pair-start' : undefined}>
        <span className="whitespace-nowrap">{row.date}</span>
        {row.time && <span className="summary-muted whitespace-nowrap"> {row.time}</span>}
      </td>
      <td>{row.bloodPressure ?? '—'}</td>
      <td>{row.pulse ?? '—'}</td>
      <td className="whitespace-nowrap">{row.glucose ?? '—'}</td>
    </>
  );
}
