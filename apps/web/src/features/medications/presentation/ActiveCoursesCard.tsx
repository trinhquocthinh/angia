import type { CourseConflict } from '@angia/contracts';
import { doseSlotLabel } from '@src/features/documents/application/doseSlots';
import { doseLabel } from '../application/doseLabel';

// Thẻ phải của nhóm trùng tên: liệt kê đủ các đợt cũ đang có hiệu lực (SPEC-015).
export function ActiveCoursesCard({ courses }: { courses: CourseConflict['courses'] }) {
  return (
    <div className="rounded-xl bg-[#deebea] p-3.5">
      <p className="text-xs font-semibold text-[#404945]">
        {courses.length > 0
          ? 'Các đợt đang có hiệu lực'
          : 'Danh sách đã thay đổi: hiện không còn đợt trùng tên có hiệu lực.'}
      </p>
      <ul className="mt-1.5 flex flex-col gap-2">
        {courses.map((course) => (
          <li key={course.id}>
            <strong className="font-semibold">
              {course.name} {course.strength}
            </strong>{' '}
            · {doseLabel(course.quantityPerDose, course.doseUnit)} ·{' '}
            {course.slots.map(doseSlotLabel).join(', ')}
            <span className="block text-[13px] text-[#404945]">
              Từ {course.startDate} · {course.endDate ? `đến ${course.endDate}` : 'Dài hạn'}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
