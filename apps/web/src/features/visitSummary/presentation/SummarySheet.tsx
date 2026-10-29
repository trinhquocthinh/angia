import type { VisitSummary } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { adherenceRows } from '../application/adherenceRows';
import { labRows } from '../application/labRows';
import { measurementRows } from '../application/measurementRows';
import { medicationRows } from '../application/medicationRows';
import { vietnamDate } from '../application/vietnamDate';
import { SummaryAdherence } from './SummaryAdherence';
import { SummaryLabs } from './SummaryLabs';
import { NARROW_CAPACITY, SummaryMeasurements } from './SummaryMeasurements';
import { SummaryMedications } from './SummaryMedications';

// Trang A4 (Design v0.1 §7): đầu trang hồ sơ + khoảng dữ liệu; thuốc; số đo cạnh xét nghiệm + giai đoạn.
// Nhiều số đo → bảng số đo nén toàn chiều ngang ở cuối (owner chốt E6-S1-T2). Chân trang miễn trừ +
// ngày tạo lặp mỗi trang in (BR-035). Khung là bảng trình bày để trình duyệt lặp tfoot khi in.
export function SummarySheet({ summary }: { summary: VisitSummary }) {
  const created = vietnamDate(new Date(summary.createdAt));
  const rows = summary.showsVitals ? measurementRows(summary.measurements) : [];
  const measurements = <SummaryMeasurements rows={rows} />;
  const side = (
    <>
      <SummaryLabs rows={labRows(summary.latestLabResults)} />
      <SummaryAdherence rows={adherenceRows(summary.adherencePeriods)} />
    </>
  );
  return (
    <article className="summary-sheet" aria-label={`Bản tóm tắt đi khám ${summary.profile.displayName}`}>
      <table role="presentation" className="summary-frame">
        <tbody>
          <tr className="summary-frame__row">
            <td className="summary-frame__cell">
              <div className="summary-content">
                <SheetHeader summary={summary} createdYear={Number(created.slice(0, 4))} />
                <SummaryMedications rows={medicationRows(summary.currentMedications, created)} />
                {!summary.showsVitals ? (
                  <div className="summary-grid summary-grid--even">{side}</div>
                ) : rows.length > NARROW_CAPACITY ? (
                  <>
                    <div className="summary-grid summary-grid--even">{side}</div>
                    {measurements}
                  </>
                ) : (
                  <div className="summary-grid">
                    {measurements}
                    <div className="flex flex-col gap-[18px]">{side}</div>
                  </div>
                )}
              </div>
            </td>
          </tr>
        </tbody>
        <tfoot>
          <tr className="summary-frame__row">
            <td className="summary-frame__cell">
              <footer className="summary-footer">
                <span className="text-[#1f2a2a] italic">{summary.disclaimer}</span>
                <span className="whitespace-nowrap tabular-nums">Tạo ngày {formatDay(created)}</span>
              </footer>
            </td>
          </tr>
        </tfoot>
      </table>
    </article>
  );
}

function SheetHeader({ summary, createdYear }: { summary: VisitSummary; createdYear: number }) {
  const { displayName, birthYear } = summary.profile;
  const name = birthYear === null ? displayName : `${displayName} · ${createdYear - birthYear} tuổi`;
  return (
    <header className="flex items-end justify-between gap-6 border-b-[1.5px] border-[#1f2a2a] pb-2.5">
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className="text-[11pt] font-semibold tracking-[.06em] text-[#2f6f5e]">
          AN GIA · TÓM TẮT SỨC KHỎE
        </span>
        <span className="text-[20pt] leading-[26pt] font-semibold break-words">{name}</span>
      </div>
      <div className="flex shrink-0 flex-col text-right">
        <span className="summary-muted">Khoảng thời gian</span>
        <span className="font-semibold tabular-nums">
          {formatDay(summary.from)} – {formatDay(summary.to)}
        </span>
      </div>
    </header>
  );
}
