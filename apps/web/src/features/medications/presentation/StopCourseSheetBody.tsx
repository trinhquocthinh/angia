import { StopCourseSheetHeader } from './StopCourseSheetHeader';
import { StopCourseSelector } from './StopCourseSelector';
import { useState } from 'react';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { useStoppableCourses } from '../application/useStoppableCourses';
import type { useStopCourse } from '../application/useStopCourse';
import { StopCourseForm } from './StopCourseForm';
type Props = {
  profile: HealthProfile;
  courses: ReturnType<typeof useStoppableCourses>;
  state: ReturnType<typeof useStopCourse>;
  onClose: () => void;
};
export function StopCourseSheetBody({ profile, courses, state, onClose }: Props) {
  const [selectedId, setSelectedId] = useState('');
  const selected = courses.data?.courses.find((course) => course.id === selectedId);
  const unavailable = courses.isFetching || courses.isError;
  return (
    <div className="flex flex-col gap-5">
      <StopCourseSheetHeader name={profile.displayName} pending={state.pending} onClose={onClose} />
      {state.saved ? (
        <p role="status">
          Đã ghi nhận dừng {state.saved.name}. Ngày hiệu lực cuối: {state.saved.endDate}.
        </p>
      ) : profile.consentStatus !== 'confirmed' ? (
        <p role="alert">Hồ sơ chưa được đồng ý lưu dữ liệu.</p>
      ) : (
        <>
          {courses.isFetching && <p role="status">Đang tải các đợt thuốc…</p>}
          {courses.isError && (
            <div role="alert">
              <p>Không thể tải các đợt thuốc.</p>
              <button type="button" onClick={() => void courses.refetch()} className="min-h-11 underline">
                Thử lại
              </button>
            </div>
          )}
          {state.error && <p role="alert">{state.error.message}</p>}
          {!unavailable && courses.data?.courses.length === 0 && (
            <p>Không có đợt thuốc có thể ghi nhận dừng.</p>
          )}
          {!unavailable && Boolean(courses.data?.courses.length) && (
            <>
              <StopCourseSelector
                courses={courses.data!.courses}
                selectedId={selectedId}
                pending={state.pending}
                onSelect={setSelectedId}
              />
              {selected && (
                <StopCourseForm
                  key={`${selected.id}:${courses.data!.today}:${selected.endDate}`}
                  course={selected}
                  today={courses.data!.today}
                  pending={state.pending}
                  onSubmit={(date) => void state.submit(selected.id, date)}
                />
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
