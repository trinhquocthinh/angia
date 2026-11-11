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
        className="min-h-11 rounded-xl bg-accent-soft px-4 text-sm font-semibold text-text-secondary transition-colors hover:bg-border hover:text-text-primary disabled:opacity-55 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
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
