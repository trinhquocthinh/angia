import { Link } from '@tanstack/react-router';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { SegmentedToggle } from '@src/features/measurements/presentation/components/SegmentedToggle';
import type { SummaryMonths, SummaryRange } from '../application/summaryRange';
import { PrinterIcon } from './PrinterIcon';

const MONTH_OPTIONS = [
  { value: 1, label: '1 tháng' },
  { value: 3, label: '3 tháng' },
  { value: 6, label: '6 tháng' },
] as const;

type Props = {
  profileId: string;
  displayName: string;
  range: SummaryRange;
  months: SummaryMonths;
  onMonthsChange: (months: SummaryMonths) => void;
  canPrint: boolean;
};

// Đầu màn tóm tắt (Design Web §6): về hồ sơ, tiêu đề + khoảng, chọn 1/3/6 tháng, "In / Lưu PDF" là hành động chính.
export function SummaryToolbar({ profileId, displayName, range, months, onMonthsChange, canPrint }: Props) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-5 shadow-sm lg:flex-row lg:items-center">
      <Link
        to="/profiles/$profileId"
        params={{ profileId }}
        className="min-h-11 self-start content-center rounded-lg px-1 text-[15px] font-medium text-[#2f6f5e] hover:bg-[#e3efea] lg:self-center"
      >
        ‹ {displayName}
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <h1 className="text-2xl font-semibold break-words text-[#131d1d]">Tóm tắt đi khám · {displayName}</h1>
        <p className="text-[15px] font-medium text-[#55615f] tabular-nums">
          Xem trước khổ A4 · {formatDay(range.from)} – {formatDay(range.to)}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedToggle
          label="Khoảng thời gian"
          value={months}
          options={MONTH_OPTIONS}
          onChange={onMonthsChange}
        />
        <button
          type="button"
          disabled={!canPrint}
          onClick={() => window.print()}
          className="flex min-h-[52px] items-center gap-2 rounded-xl bg-[#2f6f5e] px-5 text-[17px] font-semibold text-white hover:bg-[#255a4c] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#286958] disabled:opacity-60"
        >
          <PrinterIcon />
          In / Lưu PDF
        </button>
      </div>
    </div>
  );
}
