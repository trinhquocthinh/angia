import { useState } from 'react';
import type { MedicationCourse } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { MedicationDrawerFooter } from './MedicationDrawerFooter';
import { StopCourseDetails } from './StopCourseDetails';
type Props = {
  course: MedicationCourse;
  today: string;
  pending: boolean;
  onSubmit: (date: string) => void;
  onCancel: () => void;
};
export function StopCourseForm({ course, today, pending, onSubmit, onCancel }: Props) {
  const max = course.endDate !== null && course.endDate < today ? course.endDate : today;
  const [date, setDate] = useState(max);
  const invalid = !date || date < course.startDate || date > max;
  return (
    <form
      className="flex flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        if (!pending && !invalid) onSubmit(date);
      }}
    >
      <fieldset disabled={pending} className="flex flex-col gap-6 border-0 px-6 py-5">
        <StopCourseDetails course={course} />
        <div className="flex flex-col gap-2">
          <label htmlFor="stop-date" className="text-xs font-bold tracking-wider text-[#55615f] uppercase">
            Dừng từ ngày <span className="text-[#b42318]">*</span>
          </label>
          <input
            id="stop-date"
            type="date"
            required
            min={course.startDate}
            max={max}
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="h-12 w-full rounded-xl border border-[#d9e5e4] bg-white px-3.5 text-sm font-semibold tabular-nums focus:border-[#004135] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#004135]/20"
          />
          <p className="pl-1 text-[11px] text-[#55615f] italic">
            Mặc định là {formatDay(max)}. Từ ngày đã chọn, đợt thuốc không còn hiệu lực; các ngày trước đó vẫn
            được giữ trong lịch sử. Thao tác này không có chức năng hoàn tác.
          </p>
        </div>
      </fieldset>
      <MedicationDrawerFooter
        submitLabel={pending ? 'Đang ghi nhận…' : 'Xác nhận dừng đợt thuốc'}
        cancelLabel="Hủy bỏ & Giữ nguyên đợt thuốc"
        disabled={pending || invalid}
        submit={true}
        cancelDisabled={pending}
        onCancel={onCancel}
      />
    </form>
  );
}
