import { Link } from '@tanstack/react-router';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { SegmentedToggle } from '@src/features/measurements/presentation/components/SegmentedToggle';
import { ProfileSectionIcon } from '@src/features/profiles/presentation/components/ProfileSectionIcon';
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
    <div className="profile-bento-card flex flex-col gap-4 p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/profiles/$profileId"
          params={{ profileId }}
          className="inline-flex min-h-11 items-center rounded-2xl border border-border/45 bg-bg px-4 text-caption font-semibold text-accent transition-colors hover:bg-accent-soft"
        >
          ‹ {displayName}
        </Link>
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
            className="inline-flex min-h-btn cursor-pointer items-center gap-2 rounded-2xl bg-accent px-5 text-button-primary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PrinterIcon />
            In / Lưu PDF
          </button>
        </div>
      </div>
      <div className="flex items-start gap-3.5">
        <ProfileSectionIcon name="receipt_long" size={44} />
        <div className="min-w-0 flex-1">
          <h1 className="auth-heading text-heading-1 font-semibold break-words text-accent">
            Tóm tắt đi khám · {displayName}
          </h1>
          <p className="mt-1 text-caption font-medium text-text-secondary tabular-nums">
            Xem trước khổ A4 · {formatDay(range.from)} – {formatDay(range.to)}
          </p>
        </div>
      </div>
    </div>
  );
}
