import type { SummaryLabRow } from '../application/labRows';

// "Xét nghiệm gần nhất" từng chỉ số (ngày xét nghiệm ghi dưới tên): nguyên văn phiếu, không tô màu kết quả
// ngoài khoảng (BR-033).
export function SummaryLabs({ rows }: { rows: SummaryLabRow[] }) {
  return (
    <section>
      <h3>Xét nghiệm gần nhất</h3>
      {rows.length === 0 ? (
        <p className="summary-muted">Không có kết quả xét nghiệm.</p>
      ) : (
        <>
          <table className="summary-table">
            <thead>
              <tr>
                <th scope="col">Chỉ số</th>
                <th scope="col">Kết quả</th>
                <th scope="col">Tham chiếu*</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className="break-words">
                    {row.testName}
                    <span className="summary-muted block text-[9pt] leading-[12pt]">{row.date}</span>
                  </td>
                  <td className="whitespace-nowrap">{row.result}</td>
                  <td className="break-words">{row.referenceRange}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="summary-muted mt-1">* Khoảng tham chiếu in trên phiếu của nơi xét nghiệm.</p>
        </>
      )}
    </section>
  );
}
