import type { MedicationCourse } from '@angia/contracts';
import type { useStoppableCourses } from '../application/useStoppableCourses';
import { StopCourseSelector } from './StopCourseSelector';
type Props = {
  courses: ReturnType<typeof useStoppableCourses>;
  list: MedicationCourse[] | undefined;
  selected: MedicationCourse | undefined;
  selectedId: string;
  pending: boolean;
  error: string | null;
  onSelect: (id: string) => void;
};
const notice = 'rounded-xl p-4 text-sm leading-6';

// SPEC-017: không chọn sẵn đợt; chưa chọn thì hiện trạng thái rỗng viền đứt (Stitch f29c92d0).
export function StopCourseChooser({ courses, list, selected, selectedId, pending, error, onSelect }: Props) {
  return (
    <div className="flex flex-col gap-5 px-6 pt-5">
      {courses.isFetching && <p role="status">Đang tải các đợt thuốc…</p>}
      {courses.isError && (
        <div role="alert" className={`${notice} flex flex-col items-start gap-2 bg-[#fdecea]`}>
          <p>Không thể tải các đợt thuốc.</p>
          <button
            type="button"
            onClick={() => void courses.refetch()}
            className="min-h-11 font-semibold underline"
          >
            Thử lại
          </button>
        </div>
      )}
      {error && (
        <p role="alert" className={`${notice} bg-[#fdecea] text-[#b42318]`}>
          {error}
        </p>
      )}
      {list?.length === 0 && <EmptyBox title="Không có đợt thuốc nào có thể đánh dấu dừng." />}
      {Boolean(list?.length) && (
        <StopCourseSelector courses={list!} selectedId={selectedId} pending={pending} onSelect={onSelect} />
      )}
      {Boolean(list?.length) && !selected && (
        <EmptyBox
          title="Chưa chọn đợt thuốc nào"
          body="Chọn một đợt thuốc từ danh sách bên trên để nhập ngày dừng."
        />
      )}
    </div>
  );
}

function EmptyBox({ title, body }: { title: string; body?: string }) {
  return (
    <div className="rounded-2xl border-2 border-dashed border-[#d9e5e4] bg-[#f6fbfa] px-4 py-8 text-center">
      <p className="text-sm font-semibold text-[#131d1d]">{title}</p>
      {body && <p className="mx-auto mt-1 max-w-xs text-xs text-[#55615f]">{body}</p>}
    </div>
  );
}
