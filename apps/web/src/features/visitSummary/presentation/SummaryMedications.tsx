import type { SummaryMedicationRow } from '../application/medicationRows';

// "Thuốc đang dùng" tại ngày tạo (SPEC-018): thuốc · liều · buổi · thời hạn · nguồn.
export function SummaryMedications({ rows }: { rows: SummaryMedicationRow[] }) {
  return (
    <section>
      <h3>Thuốc đang dùng</h3>
      {rows.length === 0 ? (
        <p className="summary-muted">Không có thuốc đang dùng tại ngày tạo.</p>
      ) : (
        <table className="summary-table">
          <thead>
            <tr>
              <th scope="col">Thuốc</th>
              <th scope="col">Liều · buổi</th>
              <th scope="col">Thời hạn</th>
              <th scope="col">Nguồn</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="font-semibold">{row.name}</td>
                <td>{row.dose}</td>
                <td>{row.duration}</td>
                <td>{row.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
