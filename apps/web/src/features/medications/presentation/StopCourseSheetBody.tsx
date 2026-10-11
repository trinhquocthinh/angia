import { useState } from 'react';
import type { HealthProfile } from '@src/features/profiles/application/ports';
import { formatDay } from '@src/features/measurements/application/formatMeasurement';
import type { useStoppableCourses } from '../application/useStoppableCourses';
import type { useStopCourse } from '../application/useStopCourse';
import { MedicationDrawer } from './MedicationDrawer';
import { MedicationDrawerFooter } from './MedicationDrawerFooter';
import { StopCourseChooser } from './StopCourseChooser';
import { StopCourseForm } from './StopCourseForm';
type Props = {
  profile: HealthProfile;
  courses: ReturnType<typeof useStoppableCourses>;
  state: ReturnType<typeof useStopCourse>;
  onClose: () => void;
};

export function StopCourseSheetBody({ profile, courses, state, onClose }: Props) {
  const [selectedId, setSelectedId] = useState('');
  const consented = profile.consentStatus === 'confirmed';
  const list = consented && !courses.isFetching && !courses.isError ? courses.data?.courses : undefined;
  const selected = list?.find((course) => course.id === selectedId);
  return (
    <MedicationDrawer
      titleId="stop-course-title"
      title={`Ghi nhận dừng thuốc cho ${profile.displayName}`}
      subtitle="Chọn đợt thuốc và ngày bắt đầu dừng; lịch sử trước đó được giữ nguyên."
      closeLabel="Đóng ghi nhận dừng thuốc"
      pending={state.pending}
      onClose={onClose}
    >
      {state.saved ? (
        <p role="status" className="mx-6 mt-5 rounded-xl bg-[#e4f0ef] p-4 text-sm leading-6">
          Đã ghi nhận dừng {state.saved.name}. Ngày hiệu lực cuối:{' '}
          {state.saved.endDate ? formatDay(state.saved.endDate) : '—'}.
        </p>
      ) : !consented ? (
        <p role="alert" className="px-6 pt-5">
          Hồ sơ chưa được đồng ý lưu dữ liệu.
        </p>
      ) : (
        <StopCourseChooser
          courses={courses}
          list={list}
          selected={selected}
          selectedId={selectedId}
          pending={state.pending}
          error={state.error?.message ?? null}
          onSelect={setSelectedId}
        />
      )}
      {selected && !state.saved ? (
        <StopCourseForm
          key={`${selected.id}:${courses.data!.today}:${selected.endDate}`}
          course={selected}
          today={courses.data!.today}
          pending={state.pending}
          onSubmit={(date) => void state.submit(selected.id, date)}
          onCancel={onClose}
        />
      ) : (
        <MedicationDrawerFooter
          submitLabel={state.saved || !consented ? null : 'Xác nhận dừng đợt thuốc'}
          cancelLabel={state.saved || !consented ? 'Đóng' : 'Hủy bỏ & Giữ nguyên đợt thuốc'}
          disabled={true}
          submit={false}
          cancelDisabled={state.pending}
          onCancel={onClose}
        />
      )}
    </MedicationDrawer>
  );
}
