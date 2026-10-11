import { useState } from 'react';
import type { MedicationCourse } from '@angia/contracts';
type Props = { course: MedicationCourse; today: string; pending: boolean; onSubmit: (date: string) => void };
export function StopCourseForm({ course, today, pending, onSubmit }: Props) {
  const max = course.endDate !== null && course.endDate < today ? course.endDate : today;
  const [date, setDate] = useState(max);
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (!pending && date >= course.startDate && date <= max) onSubmit(date);
      }}
    >
      <p>
        <strong>{course.name}</strong>
        {course.strength ? ` · ${course.strength}` : ''} · Mỗi lần {course.quantityPerDose}{' '}
        {course.doseUnit ?? ''}
      </p>
      <p className="text-sm">
        Đợt bắt đầu {course.startDate}
        {course.endDate ? `, kết thúc ${course.endDate}` : ', dài hạn'}.
      </p>
      <fieldset disabled={pending} className="flex flex-col gap-4">
        <label className="flex flex-col gap-2">
          Dừng từ ngày
          <input
            type="date"
            required
            min={course.startDate}
            max={max}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="min-h-11 rounded-xl border border-[#cbd7d2] px-3"
          />
        </label>
        <p className="text-sm">
          Từ ngày đã chọn, đợt thuốc không còn hiệu lực. Các ngày trước đó vẫn được giữ trong lịch sử. Thao
          tác này không có chức năng hoàn tác.
        </p>
        <button
          type="submit"
          disabled={pending || !date || date < course.startDate || date > max}
          className="min-h-11 rounded-full bg-[#004135] px-5 font-semibold text-white disabled:opacity-55"
        >
          {pending ? 'Đang ghi nhận…' : 'Xác nhận dừng đợt thuốc'}
        </button>
      </fieldset>
    </form>
  );
}
