import { Link } from '@tanstack/react-router';
import type { CurrentMedications } from '@angia/contracts';
import { groupMedicationsBySlot } from '../application/groupMedicationsBySlot';
import { MedicationSlotSection } from './MedicationSlotSection';

type Props = {
  data: CurrentMedications | undefined;
  loading: boolean;
  error: boolean;
  retry: () => void;
};

// Design §6 "Danh mục thuốc": nhóm theo buổi, 2 cột ở desktop; khung xương thẻ thuốc, thẻ lỗi, trạng thái rỗng.
export function MedicationCatalog({ data, loading, error, retry }: Props) {
  if (loading)
    return (
      <div role="status" aria-label="Đang tải danh mục thuốc" className="grid gap-4 md:grid-cols-2">
        {[0, 1].map((key) => (
          <div key={key} className="h-48 animate-pulse rounded-[20px] bg-white motion-reduce:animate-none" />
        ))}
      </div>
    );
  if (error || !data)
    return (
      <div role="alert" className="flex flex-col items-start gap-3 rounded-[20px] bg-[#fdecea] p-5 text-sm">
        <p>Không tải được danh mục thuốc.</p>
        <button
          type="button"
          onClick={retry}
          className="min-h-11 rounded-xl bg-white px-4 font-semibold text-[#004135]"
        >
          Thử lại
        </button>
      </div>
    );
  const groups = groupMedicationsBySlot(data.courses);
  if (groups.length === 0)
    return (
      <div className="flex flex-col items-center gap-3 rounded-[20px] border-2 border-dashed border-[#d9e5e4] bg-white px-6 py-12 text-center">
        <p className="text-sm font-semibold text-[#131d1d]">
          Chưa có thuốc. Hãy tải đơn thuốc hoặc khai báo thuốc bổ.
        </p>
        <Link
          to="/upload"
          className="min-h-11 content-center rounded-full bg-[#004135] px-5 text-sm font-semibold text-white"
        >
          Tải ảnh đơn thuốc
        </Link>
      </div>
    );
  return (
    <div className="grid items-start gap-4 md:grid-cols-2">
      {groups.map((group) => (
        <MedicationSlotSection key={group.slot} group={group} today={data.today} />
      ))}
    </div>
  );
}
