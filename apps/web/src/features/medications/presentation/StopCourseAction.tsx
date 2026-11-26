import { useState } from 'react';
import type { HealthProfile, ProfileSession } from '@src/features/profiles/application/ports';
import { createMedicationStoppingRepository } from '../infrastructure/createMedicationStoppingRepository';
import { StopCourseSheet } from './StopCourseSheet';
const repository = createMedicationStoppingRepository();
export function StopCourseAction({ profile, session }: { profile: HealthProfile; session: ProfileSession }) {
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
            ? 'Cần người thân xác nhận trước khi đánh dấu dừng thuốc'
            : undefined
        }
        className="inline-flex min-h-btn items-center rounded-2xl border border-border/45 bg-surface px-4 text-button-secondary font-semibold text-text-primary shadow-stitch-sm transition-colors hover:bg-accent-soft hover:text-accent disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        Đánh dấu dừng thuốc
      </button>
      {open && (
        <StopCourseSheet
          key={`${session.account.id}:${session.family.id}:${profile.id}`}
          profile={profile}
          session={session}
          repository={repository}
          onClose={() => setOpen(false)}
        />
      )}
    </div>
  );
}
