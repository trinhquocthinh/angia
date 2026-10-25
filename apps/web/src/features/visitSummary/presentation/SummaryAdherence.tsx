import type { SummaryAdherenceRow } from '../application/adherenceRows';

// "Giai đoạn dùng thuốc": ô mẫu phân biệt bằng hoa văn (Ngưng có gạch chéo) để in đen trắng vẫn rõ.
export function SummaryAdherence({ rows }: { rows: SummaryAdherenceRow[] }) {
  return (
    <section>
      <h3>Giai đoạn dùng thuốc</h3>
      {rows.length === 0 ? (
        <p className="summary-muted">Không có giai đoạn dùng thuốc trong khoảng này.</p>
      ) : (
        <ul className="flex flex-col gap-1">
          {rows.map((row) =>
            row.periods.map((period) => (
              <li key={period.id} className="flex gap-2 break-inside-avoid">
                <span
                  aria-hidden="true"
                  className={`summary-swatch${period.status === 'stopped' ? ' summary-swatch--stopped' : ''}`}
                />
                <span>
                  <b className="font-semibold">{row.name}</b> — {period.text}
                </span>
              </li>
            )),
          )}
        </ul>
      )}
    </section>
  );
}
