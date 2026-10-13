import type { UseQueryResult } from '@tanstack/react-query';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { STATUS_LABEL } from '../application/periodText';
import type { AdherencePeriod, AdherencePeriodList } from '../application/ports';

type Props = {
  consented: boolean;
  list: Pick<UseQueryResult<AdherencePeriodList>, 'isPending' | 'isError' | 'refetch'>;
  saved: AdherencePeriod | null;
};

// Các trạng thái ngoài form: chưa đồng thuận, đang tải, lỗi tải, đã lưu xong.
export function AdherenceSheetNotice({ consented, list, saved }: Props) {
  if (!consented)
    return (
      <p role="alert" className="px-6 pt-5">
        Hồ sơ chưa được đồng ý lưu dữ liệu.
      </p>
    );
  if (saved)
    return (
      <p role="status" className="mx-6 mt-5 rounded-xl bg-[#e4f0ef] p-4 text-sm">
        Đã ghi nhận {saved.medicationName} · {STATUS_LABEL[saved.status]} từ {formatDay(saved.fromDate)}.
      </p>
    );
  if (list.isError)
    return (
      <div
        role="alert"
        className="mx-6 mt-5 flex flex-col items-start gap-3 rounded-xl bg-[#fdecea] p-4 text-sm"
      >
        <p>Không tải được giai đoạn dùng thuốc.</p>
        <button
          type="button"
          onClick={() => void list.refetch()}
          className="min-h-11 rounded-xl bg-white px-4 font-semibold text-[#004135]"
        >
          Thử lại
        </button>
      </div>
    );
  return (
    <p role="status" className="px-6 pt-5 text-sm text-[#55615f]">
      Đang tải giai đoạn dùng thuốc…
    </p>
  );
}
