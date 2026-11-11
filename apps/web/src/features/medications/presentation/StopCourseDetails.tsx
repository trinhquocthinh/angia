import type { MedicationCourse } from '@angia/contracts';
import { doseSlotLabel, sortDoseSlots } from '@src/features/documents/application/doseSlots';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { doseLabel } from '../application/doseLabel';

// Thẻ chi tiết đợt đã chọn (Stitch f29c92d0) — chỉ dữ liệu có trong đợt; không gắn nhóm bệnh hay bác sĩ.
// Danh sách chỉ gồm đợt còn hiệu lực hôm nay (BR-029), nên nhãn trạng thái luôn là "Đang dùng".
export function StopCourseDetails({ course }: { course: MedicationCourse }) {
  const slots = sortDoseSlots(course.slots).map(doseSlotLabel);
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-border bg-bg p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-bold text-text-primary">
            {course.name}
            {course.strength ? ` ${course.strength}` : ''}
          </h3>
          <p className="text-xs text-text-secondary">
            {doseLabel(course.quantityPerDose, course.doseUnit)} · {slots.join(', ')}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-accent/20 bg-accent-soft px-2.5 py-1 text-[11px] font-semibold text-accent">
          Đang dùng
        </span>
      </div>
      <dl className="grid grid-cols-2 gap-3 border-t border-border pt-3 text-xs">
        <div>
          <dt className="text-[11px] text-text-secondary">Bắt đầu:</dt>
          <dd className="font-semibold tabular-nums">{formatDay(course.startDate)}</dd>
        </div>
        <div>
          <dt className="text-[11px] text-text-secondary">Dự kiến kết thúc:</dt>
          <dd className="font-semibold tabular-nums">
            {course.endDate ? formatDay(course.endDate) : 'Dài hạn'}
          </dd>
        </div>
        <div className="col-span-2">
          <dt className="text-[11px] text-text-secondary">Nguồn:</dt>
          <dd className="font-medium">
            {course.source === 'prescription' ? 'Theo đơn thuốc' : 'Thuốc tự thêm ngoài đơn'}
          </dd>
        </div>
      </dl>
    </div>
  );
}
