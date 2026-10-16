import type { MedicationCourse } from '@angia/contracts';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import { MatchingCourseList } from './MatchingCourseList';

type Props = {
  courses: MedicationCourse[];
  stopDate: string;
  pending: boolean;
  stopped: boolean;
  failed: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
};

// Ghi "Ngưng" thực tế (BR-031) không tự dừng đợt chỉ định; hỏi người dùng có dừng luôn đợt trong danh mục
// (SPEC-017, ngày dừng = mốc ngưng) hay giữ nguyên — chẳng hạn bỏ thuốc tự ý nhưng vẫn giữ đơn.
export function StopCoursesPrompt({
  courses,
  stopDate,
  pending,
  stopped,
  failed,
  onConfirm,
  onDismiss,
}: Props) {
  if (stopped)
    return (
      <p role="status" className="mx-6 mt-4 rounded-xl bg-[#e4f0ef] p-4 text-sm">
        Đã dừng đợt thuốc trong danh mục từ {formatDay(stopDate)}.
      </p>
    );
  return (
    <section className="mx-6 mt-4 flex flex-col gap-3 rounded-xl border border-[#ffb68c] bg-[#fff4ec] p-4 text-sm text-[#321200]">
      <p className="font-semibold">Danh mục thuốc điều trị vẫn còn:</p>
      <MatchingCourseList courses={courses} />
      <p>
        Ghi nhận thực tế không tự thay đổi danh mục thuốc điều trị.{' '}
        {courses.length > 1 ? 'Dừng luôn các đợt thuốc này' : 'Dừng luôn đợt thuốc này'} trong danh mục từ{' '}
        {formatDay(stopDate)}?
      </p>
      {failed && (
        <p role="alert" className="rounded-lg bg-[#fdecea] p-3">
          Không dừng được đợt thuốc. Vui lòng thử lại hoặc dừng ở tab Thuốc điều trị.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={pending}
          onClick={onConfirm}
          className="min-h-11 rounded-xl bg-[#004135] px-4 font-semibold text-white disabled:opacity-55"
        >
          {pending ? 'Đang dừng…' : 'Dừng đợt thuốc'}
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={onDismiss}
          className="min-h-11 rounded-xl border border-[#602900] px-4 font-semibold"
        >
          Giữ nguyên danh mục
        </button>
      </div>
    </section>
  );
}
