import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { useSelfReportedCourse } from '../application/useSelfReportedCourse';
import { MedicationDrawer } from './MedicationDrawer';
import { MedicationDrawerFooter } from './MedicationDrawerFooter';
import { SelfReportedCourseForm } from './SelfReportedCourseForm';
import { SelfReportedConflictNotice } from './SelfReportedConflictNotice';
type Props = { profile: HealthProfile; state: ReturnType<typeof useSelfReportedCourse>; onClose: () => void };
export function SelfReportedCourseSheetBody({ profile, state, onClose }: Props) {
  const editing = !state.saved && profile.consentStatus === 'confirmed';
  return (
    <MedicationDrawer
      titleId="supplement-title"
      title={`Khai báo thuốc bổ cho ${profile.displayName}`}
      subtitle="Thuốc bổ, vitamin hoặc thực phẩm chức năng không qua đơn thuốc."
      closeLabel="Đóng khai báo thuốc bổ"
      pending={state.pending}
      onClose={onClose}
    >
      {state.saved ? (
        <p role="status" className="mx-6 mt-5 rounded-xl bg-[#e4f0ef] p-4 text-sm">
          Đã lưu {state.saved.name} · Dài hạn.
        </p>
      ) : !editing ? (
        <p role="alert" className="px-6 pt-5">
          Hồ sơ chưa được đồng ý lưu dữ liệu.
        </p>
      ) : (
        <SelfReportedCourseForm
          disabled={state.pending || Boolean(state.prompt)}
          pending={state.pending}
          error={state.prompt ? null : (state.error?.message ?? null)}
          onSubmit={(request) => void state.submit(request)}
          onCancel={onClose}
        >
          {state.prompt && (
            <SelfReportedConflictNotice
              key={JSON.stringify(state.prompt)}
              {...state.prompt}
              pending={state.pending}
              onSubmit={(request) => void state.submit(request)}
              onCancel={state.reset}
            />
          )}
        </SelfReportedCourseForm>
      )}
      {!editing && (
        <MedicationDrawerFooter
          submitLabel={null}
          cancelLabel="Đóng"
          disabled={true}
          submit={false}
          cancelDisabled={state.pending}
          onCancel={onClose}
        />
      )}
    </MedicationDrawer>
  );
}
