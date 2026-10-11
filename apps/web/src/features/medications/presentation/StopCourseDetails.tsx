import type { MedicationCourse } from '@angia/contracts';
import { DOSE_SLOTS } from '@src/features/documents/application/doseSlots';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';

// Thẻ chi tiết đợt đã chọn (Stitch f29c92d0) — chỉ dữ liệu có trong đợt; không gắn nhóm bệnh hay bác sĩ.
export function StopCourseDetails({ course, today }: { course: MedicationCourse; today: string }) {
  const overdue = course.endDate !== null && course.endDate < today;
  const slots = DOSE_SLOTS.filter((slot) => course.slots.includes(slot.value)).map((slot) => slot.label);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-[#d9e5e4] bg-[#f6fbfa] p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-bold text-[#131d1d]">
            {course.name}
            {course.strength ? ` ${course.strength}` : ''}
          </h3>
          <p className="text-xs text-[#55615f]">
            Mỗi lần {course.quantityPerDose} {course.doseUnit ?? ''} · {slots.join(', ')}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-[#004135]/20 bg-[#e8f1ee] px-2.5 py-1 text-[11px] font-semibold text-[#004135]">
          {overdue ? 'Đã qua kỳ hạn' : 'Đang dùng'}
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-3 border-t border-[#d9e5e4] pt-3 text-xs">
        <div>
          <dt className="text-[11px] text-[#55615f]">Bắt đầu:</dt>
          <dd className="font-semibold tabular-nums">{formatDay(course.startDate)}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-[#55615f]">Dự kiến kết thúc:</dt>
          <dd className="font-semibold tabular-nums">
            {course.endDate ? formatDay(course.endDate) : 'Dài hạn'}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[11px] text-[#55615f]">Nguồn:</dt>
          <dd className="font-medium">
            {course.source === 'prescription' ? 'Theo đơn thuốc' : 'Tự khai báo'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
