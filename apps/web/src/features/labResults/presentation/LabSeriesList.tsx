import { Link } from '@tanstack/react-router';
import type { LabSeries } from '@angia/contracts';
import { LabSeriesCard } from './LabSeriesCard';

type Props = {
  data: LabSeries[] | undefined;
  loading: boolean;
  error: boolean;
  retry: () => void;
};

// Design §6 "Kết quả cận lâm sàng": thẻ từng chỉ số, 2 cột ở desktop; khung xương, thẻ lỗi, trạng thái rỗng.
export function LabSeriesList({ data, loading, error, retry }: Props) {
  if (loading)
    return (
      <div role="status" aria-label="Đang tải kết quả xét nghiệm" className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((key) => (
          <div key={key} className="h-48 animate-pulse rounded-xl bg-white motion-reduce:animate-none" />
        ))}
      </div>
    );
  if (error || !data)
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-[20px] bg-[#fdecea] p-5 text-sm">
        <p>Không tải được kết quả xét nghiệm.</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-11 rounded-xl bg-white px-4 font-semibold text-[#004135]"
        >
          Thử lại
        </button>
      </div>
    );
  if (data.length === 0)
    return (
      <div className="flex flex-col items-center gap-3 rounded-[20px] border-2 border-dashed border-[#d9e5e4] bg-white px-6 py-12 text-center">
        <p className="text-sm font-semibold text-[#131d1d]">Chưa có kết quả cận lâm sàng.</p>
        <Link
          to="/upload"
          className="min-h-11 content-center rounded-full bg-[#004135] px-5 text-sm font-semibold text-white"
        >
          Tải ảnh phiếu xét nghiệm
        </Link>
      </div>
    );
  return (
    <div className="grid items-start gap-4 md:grid-cols-2">
      {data.map((series, index) => (
        <LabSeriesCard key={series.results[0]!.id} series={series} index={index} />
      ))}
    </div>
  );
}
