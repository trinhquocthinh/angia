import { lazy, Suspense, useState } from 'react';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { createMedicationRepository } from '../infrastructure/createMedicationRepository';

const SelfReportedCourseSheet = lazy(() =>
  import('./SelfReportedCourseSheet').then((module) => ({ default: module.SelfReportedCourseSheet })),
);
const repository = createMedicationRepository();
export function SelfReportedCourseAction({
  profile,
  session,
}: {
  profile: HealthProfile;
  session: ProfileSession;
}) {
  const [open, setOpen] = useState(false);
  if (session.role !== 'main' || !session.family) return null;
  return (
    <div>
      <button
        type="button"
        disabled={profile.consentStatus !== 'confirmed'}
        onClick={() => setOpen(true)}
        title={
          profile.consentStatus !== 'confirmed'
            ? 'Cần người thân xác nhận trước khi thêm thuốc bổ, vitamin'
            : undefined
        }
        className="inline-flex min-h-btn items-center gap-2 rounded-2xl bg-accent px-4 text-button-secondary font-semibold text-on-accent shadow-stitch-sm transition-colors hover:bg-accent-hover disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <span aria-hidden="true" className="text-heading-3 leading-none">
          +
        </span>
        Thêm thuốc bổ, vitamin
      </button>
      {open && (
        <Suspense fallback={null}>
          <SelfReportedCourseSheet
            key={`${session.account.id}:${session.family.id}:${profile.id}`}
            profile={profile}
            session={session}
            repository={repository}
            onClose={() => setOpen(false)}
          />
        </Suspense>
      )}
    </div>
  );
}
