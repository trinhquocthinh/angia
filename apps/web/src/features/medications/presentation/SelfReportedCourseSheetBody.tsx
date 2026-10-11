import type { HealthProfile } from '@src/features/profiles/application/ports';
import type { useSelfReportedCourse } from '../application/useSelfReportedCourse';
import { SelfReportedCourseForm } from './SelfReportedCourseForm';
import { SelfReportedConflictNotice } from './SelfReportedConflictNotice';
type Props = { profile: HealthProfile; state: ReturnType<typeof useSelfReportedCourse>; onClose: () => void };
export function SelfReportedCourseSheetBody({ profile, state, onClose }: Props) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start justify-between gap-3">
        <h2 id="supplement-title" className="text-xl font-semibold text-[#004135]">
          Khai báo thuốc bổ cho {profile.displayName}
        </h2>
        <button
          type="button"
          disabled={state.pending}
          onClick={onClose}
          aria-label="Đóng khai báo thuốc bổ"
          className="min-h-11 min-w-11 rounded-xl border border-[#cbd7d2]"
        >
          Đóng
        </button>
      </div>
      {state.saved ? (
        <p role="status" className="rounded-xl bg-[#e4f0ef] p-4">
          Đã lưu {state.saved.name} · Dài hạn.
        </p>
      ) : profile.consentStatus !== 'confirmed' ? (
        <p role="alert">Hồ sơ chưa được đồng ý lưu dữ liệu.</p>
      ) : (
        <>
          <SelfReportedCourseForm
            disabled={state.pending || Boolean(state.prompt)}
            pending={state.pending}
            error={state.prompt ? null : (state.error?.message ?? null)}
            onSubmit={(request) => void state.submit(request)}
          />
          {state.prompt && (
            <SelfReportedConflictNotice
              key={JSON.stringify(state.prompt)}
              {...state.prompt}
              pending={state.pending}
              onSubmit={(request) => void state.submit(request)}
              onCancel={state.reset}
            />
          )}
        </>
      )}
    </div>
  );
}
