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
          profile.consentStatus !== 'confirmed' ? 'Cần đồng thuận trước khi ghi nhận dừng thuốc' : undefined
        }
        className="min-h-11 rounded-full border border-[#cbd7d2] px-5 text-sm font-semibold text-[#004135] disabled:opacity-55"
      >
        Ghi nhận dừng thuốc
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
